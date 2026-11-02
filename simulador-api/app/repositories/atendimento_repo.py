"""Consultas SQL de ATENDIMENTO. A simulador-api é a única que escreve aqui."""
from sqlalchemy import text
from sqlalchemy.orm import Session


def travar_geracao_de_codigo(db: Session, id_ubs: int) -> None:
    """Impede que duas senhas da mesma unidade peguem o mesmo número.

    O lock vale até o fim da transação (commit ou rollback) e só segura
    quem tenta retirar senha na MESMA unidade ao mesmo tempo.
    """
    db.execute(text("SELECT pg_advisory_xact_lock(1, :id_ubs)"), {"id_ubs": id_ubs})


def maior_numero_do_dia(db: Session, id_ubs: int, fuso: str) -> int | None:
    """Maior número de senha já emitido hoje na unidade (None se ainda não houve)."""
    sql = text(
        """
        SELECT MAX(CAST(substring(codigo_senha FROM '[0-9]+$') AS integer))
        FROM atendimento
        WHERE id_ubs = :id_ubs
          AND entrada >= (date_trunc('day', now() AT TIME ZONE :fuso) AT TIME ZONE :fuso)
        """
    )
    return db.execute(sql, {"id_ubs": id_ubs, "fuso": fuso}).scalar()


def inserir_senha(db: Session, id_ubs: int, id_servico: int, codigo_senha: str) -> dict:
    """Cria a senha 'aguardando' com o horário de entrada (agora)."""
    sql = text(
        """
        INSERT INTO atendimento (id_ubs, id_servico, codigo_senha, status, entrada)
        VALUES (:id_ubs, :id_servico, :codigo, 'aguardando', now())
        RETURNING id_atendimento, id_ubs, codigo_senha, status, entrada
        """
    )
    linha = db.execute(
        sql, {"id_ubs": id_ubs, "id_servico": id_servico, "codigo": codigo_senha}
    ).mappings().one()
    return dict(linha)


def listar_fila(db: Session, id_ubs: int) -> list[dict]:
    """Senhas aguardando e em atendimento, da mais antiga para a mais nova."""
    sql = text(
        """
        SELECT id_atendimento, codigo_senha, status, entrada, inicio_atendimento
        FROM atendimento
        WHERE id_ubs = :id_ubs AND status IN ('aguardando', 'em_atendimento')
        ORDER BY entrada, id_atendimento
        """
    )
    return [dict(r) for r in db.execute(sql, {"id_ubs": id_ubs}).mappings().all()]
