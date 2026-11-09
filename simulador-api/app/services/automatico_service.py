"""Modo automático: uma thread em segundo plano que simula movimento nas filas.

Reaproveita os mesmos casos de uso dos endpoints (retirar senha, chamar,
finalizar, desistir); a decisão do que fazer vem de domain/automatico.py.
"""
import logging
import random
import threading
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core import database
from app.domain import automatico as regras
from app.repositories import atendimento_repo, unidade_repo
from app.services import atendimento_service, simulador_service

logger = logging.getLogger("ubstrack")

ACOES = ("retirada", "chamada", "finalizacao", "desistencia")


def _segundos_desde(instante: datetime | None, agora: datetime) -> float:
    if instante is None:
        return 0.0
    if instante.tzinfo is None:
        instante = instante.replace(tzinfo=timezone.utc)
    return max((agora - instante).total_seconds(), 0.0)


def executar_rodada_da_unidade(
    db: Session, id_ubs: int, p: regras.Parametros, rng: random.Random, agora: datetime
) -> dict[str, int]:
    """Aplica uma rodada numa unidade e devolve quantas ações de cada tipo ocorreram."""
    fila = atendimento_repo.listar_fila(db, id_ubs)
    aguardando = [s["id_atendimento"] for s in fila if s["status"] == "aguardando"]
    em_atendimento = [
        (s["id_atendimento"], _segundos_desde(s["inicio_atendimento"], agora))
        for s in fila
        if s["status"] == "em_atendimento"
    ]
    acoes = regras.decidir_acoes(p, aguardando, em_atendimento, rng.random(), rng.random())
    feitas = dict.fromkeys(ACOES, 0)

    for id_atendimento in acoes.finalizar:
        try:
            atendimento_service.finalizar(db, id_atendimento)
            feitas["finalizacao"] += 1
        except (atendimento_service.TransicaoInvalida, atendimento_service.AtendimentoNaoEncontrado):
            pass  # alguém mexeu na senha pelo operador; segue
    for id_atendimento in acoes.desistir:
        try:
            atendimento_service.desistir(db, id_atendimento)
            feitas["desistencia"] += 1
        except (atendimento_service.TransicaoInvalida, atendimento_service.AtendimentoNaoEncontrado):
            pass
    for _ in range(acoes.chamar):
        try:
            atendimento_service.chamar_proximo(db, id_ubs)
            feitas["chamada"] += 1
        except atendimento_service.FilaVazia:
            break
    if acoes.retirar:
        try:
            simulador_service.retirar_senha(db, id_ubs)
            feitas["retirada"] += 1
        except (simulador_service.UnidadeNaoEncontrada, simulador_service.UnidadeSemServico):
            pass
    return feitas


class Simulacao:
    """Controla o ciclo de vida da thread (no máximo uma por processo)."""

    def __init__(self, parametros: regras.Parametros | None = None) -> None:
        self._parametros = parametros or regras.Parametros()
        self._lock = threading.Lock()
        self._parar = threading.Event()
        self._thread: threading.Thread | None = None
        self._zerar()

    def _zerar(self) -> None:
        self._intervalo_s: float | None = None
        self._rodadas = 0
        self._erros = 0
        self._iniciado_em: datetime | None = None
        self._ultima_rodada_em: datetime | None = None
        self._acoes = dict.fromkeys(ACOES, 0)

    @property
    def ativo(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def iniciar(self, intervalo_s: float) -> None:
        """Inicia se estiver parado; se já estiver ativo não faz nada."""
        with self._lock:
            if self.ativo:
                return
            self._zerar()
            self._intervalo_s = intervalo_s
            self._iniciado_em = datetime.now(timezone.utc)
            self._parar = threading.Event()
            self._thread = threading.Thread(target=self._loop, args=(self._parar,), daemon=True)
            self._thread.start()

    def parar(self) -> None:
        with self._lock:
            if self._thread is None:
                return
            self._parar.set()
            thread, self._thread = self._thread, None
        thread.join(timeout=10)
        self._intervalo_s = None

    def estado(self) -> dict:
        return {
            "ativo": self.ativo,
            "intervalo_s": self._intervalo_s if self.ativo else None,
            "rodadas": self._rodadas,
            "erros": self._erros,
            "iniciado_em": self._iniciado_em,
            "ultima_rodada_em": self._ultima_rodada_em,
            "acoes": dict(self._acoes),
        }

    def _loop(self, parar: threading.Event) -> None:
        rng = random.Random()
        while not parar.is_set():
            self._rodada(rng)
            if parar.wait(self._intervalo_s):
                break

    def _rodada(self, rng: random.Random) -> None:
        agora = datetime.now(timezone.utc)
        try:
            with database.SessionLocal() as db:
                ids = [u["id_ubs"] for u in unidade_repo.listar(db)]
                for id_ubs in ids:
                    try:
                        feitas = executar_rodada_da_unidade(db, id_ubs, self._parametros, rng, agora)
                        for k, v in feitas.items():
                            self._acoes[k] += v
                    except Exception:
                        db.rollback()
                        self._erros += 1
                        logger.exception("Modo automático: falha na unidade %s", id_ubs)
        except Exception:
            self._erros += 1
            logger.exception("Modo automático: falha ao abrir a rodada")
        self._rodadas += 1
        self._ultima_rodada_em = datetime.now(timezone.utc)


simulacao = Simulacao()
