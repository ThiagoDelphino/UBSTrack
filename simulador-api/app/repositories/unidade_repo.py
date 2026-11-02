"""Consultas SQL de UBS e do serviço oferecido por ela."""
from sqlalchemy import text
from sqlalchemy.orm import Session


def listar(db: Session) -> list[dict]:
    sql = text("SELECT id_ubs, nome, endereco FROM ubs ORDER BY nome, id_ubs")
    return [dict(r) for r in db.execute(sql).mappings().all()]


def obter(db: Session, id_ubs: int) -> dict | None:
    sql = text("SELECT id_ubs, nome, endereco FROM ubs WHERE id_ubs = :id_ubs")
    r = db.execute(sql, {"id_ubs": id_ubs}).mappings().first()
    return dict(r) if r else None


def primeiro_servico(db: Session, id_ubs: int) -> int | None:
    """No MVP cada unidade tem um serviço só ("Atendimento geral")."""
    sql = text(
        "SELECT id_servico FROM ubs_servico WHERE id_ubs = :id_ubs ORDER BY id_servico LIMIT 1"
    )
    return db.execute(sql, {"id_ubs": id_ubs}).scalar()
