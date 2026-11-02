"""Consultas SQL de ATENDIMENTO. Somente leitura (quem escreve é o simulador)."""
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

_FILTRO = "(CAST(:id_ubs AS integer) IS NULL OR id_ubs = :id_ubs)"


def contar_fila(db: Session, id_ubs: int | None = None) -> dict[int, int]:
    """Senhas 'aguardando' por unidade."""
    sql = text(
        f"""
        SELECT id_ubs, COUNT(*) AS total
        FROM atendimento
        WHERE status = 'aguardando' AND {_FILTRO}
        GROUP BY id_ubs
        """
    )
    return {r.id_ubs: int(r.total) for r in db.execute(sql, {"id_ubs": id_ubs})}


def ultimas_duracoes(db: Session, limite: int, id_ubs: int | None = None) -> dict[int, list[float]]:
    """Duração (min) dos últimos `limite` atendimentos finalizados de cada unidade."""
    sql = text(
        f"""
        SELECT id_ubs, duracao_min FROM (
            SELECT id_ubs,
                   EXTRACT(EPOCH FROM (fim_atendimento - inicio_atendimento)) / 60.0 AS duracao_min,
                   ROW_NUMBER() OVER (PARTITION BY id_ubs ORDER BY fim_atendimento DESC) AS rn
            FROM atendimento
            WHERE status = 'finalizado'
              AND inicio_atendimento IS NOT NULL
              AND fim_atendimento IS NOT NULL
              AND {_FILTRO}
        ) t
        WHERE rn <= :limite
        """
    )
    resultado: dict[int, list[float]] = {}
    for r in db.execute(sql, {"id_ubs": id_ubs, "limite": limite}):
        resultado.setdefault(r.id_ubs, []).append(float(r.duracao_min))
    return resultado


def ultima_atualizacao(db: Session, id_ubs: int | None = None) -> dict[int, datetime]:
    """Horário do movimento mais recente (entrada, início ou fim) de cada unidade."""
    sql = text(
        f"""
        SELECT id_ubs,
               GREATEST(MAX(entrada), MAX(inicio_atendimento), MAX(fim_atendimento)) AS atualizado_em
        FROM atendimento
        WHERE {_FILTRO}
        GROUP BY id_ubs
        """
    )
    return {r.id_ubs: r.atualizado_em for r in db.execute(sql, {"id_ubs": id_ubs}) if r.atualizado_em}
