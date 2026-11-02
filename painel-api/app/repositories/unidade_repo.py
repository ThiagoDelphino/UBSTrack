"""Consultas SQL de UBS. Somente leitura."""
from sqlalchemy import text
from sqlalchemy.orm import Session

_FILTRO = "(CAST(:id_ubs AS integer) IS NULL OR id_ubs = :id_ubs)"


def listar(db: Session, id_ubs: int | None = None) -> list[dict]:
    sql = text(
        f"""
        SELECT id_ubs, nome, endereco, latitude, longitude, abre_as, fecha_as
        FROM ubs
        WHERE {_FILTRO}
        ORDER BY id_ubs
        """
    )
    return [dict(r) for r in db.execute(sql, {"id_ubs": id_ubs}).mappings().all()]
