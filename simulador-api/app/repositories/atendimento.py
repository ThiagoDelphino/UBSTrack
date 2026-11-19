"""Operações de ESCRITA em atendimento: chamar próximo, finalizar e desistir.

Só a simulador-api escreve nesta tabela (role `simulador_escrita`).
Cada função faz UMA mudança de status, de forma atômica no banco, e dá
commit sozinha. Ao errar, desfaz (rollback) e levanta uma exceção deste
arquivo, que a camada de cima (service/api) traduz em resposta HTTP:

    FilaVazia                -> 404 (nenhuma senha aguardando na unidade)
    AtendimentoNaoEncontrado -> 404 (id inexistente)
    TransicaoInvalida        -> 409 (regra 12: status atual não permite)

Transições aceitas (regra 1 do guia):
    aguardando     -> em_atendimento   (chamar_proximo)
    em_atendimento -> finalizado       (finalizar)
    aguardando     -> desistiu         (desistir)

A regra de "de qual status posso sair" fica no WHERE de cada UPDATE.
Assim, validar e gravar acontecem numa única operação e dois cliques
simultâneos não passam pela mesma senha.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.transicoes import (
    AGUARDANDO,
    DESISTIU,
    EM_ATENDIMENTO,
    FINALIZADO,
    TransicaoInvalida,
    origem_de,
)

_COLUNAS = (
    "id_atendimento, id_ubs, id_servico, codigo_senha, status, "
    "entrada, inicio_atendimento, fim_atendimento"
)


class FilaVazia(Exception):
    """A unidade não tem nenhuma senha aguardando."""


class AtendimentoNaoEncontrado(Exception):
    """Não existe senha com esse id."""


def chamar_proximo(db: Session, id_ubs: int) -> dict:
    """A senha aguardando mais antiga da unidade passa para em_atendimento.

    FOR UPDATE SKIP LOCKED: se outra requisição já está pegando a primeira
    senha, esta pula para a seguinte em vez de esperar ou repetir a mesma.
    """
    sql = text(
        f"""
        UPDATE atendimento
           SET status = :novo, inicio_atendimento = now()
         WHERE id_atendimento = (
                 SELECT id_atendimento
                   FROM atendimento
                  WHERE id_ubs = :id_ubs AND status = :atual
                  ORDER BY entrada, id_atendimento
                  LIMIT 1
                    FOR UPDATE SKIP LOCKED
               )
        RETURNING {_COLUNAS}
        """
    )
    try:
        linha = db.execute(
            sql, {"id_ubs": id_ubs, "atual": AGUARDANDO, "novo": EM_ATENDIMENTO}
        ).mappings().first()
        if linha is None:
            db.rollback()
            raise FilaVazia(id_ubs)
        db.commit()
    except FilaVazia:
        raise
    except Exception:
        db.rollback()
        raise
    return dict(linha)


def finalizar(db: Session, id_atendimento: int) -> dict:
    """em_atendimento -> finalizado, gravando o fim_atendimento."""
    return _mudar_status(
        db,
        id_atendimento,
        novo=FINALIZADO,
        sql_extra="fim_atendimento = now()",
    )


def desistir(db: Session, id_atendimento: int) -> dict:
    """aguardando -> desistiu.

    A tabela não tem coluna própria para o horário da desistência, então
    ele é gravado em fim_atendimento. Isso faz a fila mudar de "atualizado
    em" (regra 8) e não atrapalha o tempo médio (regra 3), que só considera
    senhas com status 'finalizado'.
    """
    return _mudar_status(
        db,
        id_atendimento,
        novo=DESISTIU,
        sql_extra="fim_atendimento = now()",
    )


# ---------------------------------------------------------------------------
# Interno
# ---------------------------------------------------------------------------


def _mudar_status(db: Session, id_atendimento: int, *, novo: str, sql_extra: str) -> dict:
    """UPDATE condicionado ao status atual; se não casar, descobre o motivo."""
    exigido = origem_de(novo)  # regra de transição vive em app/domain/transicoes.py
    sql = text(
        f"""
        UPDATE atendimento
           SET status = :novo, {sql_extra}
         WHERE id_atendimento = :id AND status = :exigido
        RETURNING {_COLUNAS}
        """
    )
    try:
        linha = db.execute(
            sql, {"id": id_atendimento, "exigido": exigido, "novo": novo}
        ).mappings().first()
        if linha is not None:
            db.commit()
            return dict(linha)

        # Nenhuma linha mudou: ou o id não existe, ou o status não permite.
        db.rollback()
        atual = db.execute(
            text("SELECT status FROM atendimento WHERE id_atendimento = :id"),
            {"id": id_atendimento},
        ).scalar_one_or_none()
    except Exception:
        db.rollback()
        raise

    if atual is None:
        raise AtendimentoNaoEncontrado(id_atendimento)
    raise TransicaoInvalida(atual, exigido)