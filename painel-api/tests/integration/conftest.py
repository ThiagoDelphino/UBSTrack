"""Testes de integração: usam um PostgreSQL de verdade.

Só rodam quando TEST_ADMIN_DATABASE_URL está definida (o CI define; localmente,
sem ela, os testes são pulados). O banco precisa estar com as migrations
aplicadas (`alembic upgrade head`). A API sob teste usa DATABASE_URL, que deve
ser a do usuário da própria API (painel_leitura ou simulador_escrita), para
validar também as permissões do banco.
"""
import os
from pathlib import Path

import pytest
from sqlalchemy import create_engine

SEED_DEMO = Path(__file__).resolve().parents[3] / "database" / "seeds" / "seed_demo.sql"


@pytest.fixture
def unidades() -> dict[str, int]:
    """Recarrega o seed demo (estado conhecido) e devolve {nome da unidade: id}."""
    url = os.environ.get("TEST_ADMIN_DATABASE_URL")
    if not url:
        pytest.skip("defina TEST_ADMIN_DATABASE_URL para rodar os testes de integração")
    engine = create_engine(url)
    raw = engine.raw_connection()
    try:
        cur = raw.cursor()
        cur.execute(SEED_DEMO.read_text(encoding="utf-8"))
        raw.commit()
        cur.execute("SELECT nome, id_ubs FROM ubs WHERE nome LIKE 'UBS Demo%'")
        return {nome: id_ubs for nome, id_ubs in cur.fetchall()}
    finally:
        raw.close()
        engine.dispose()
