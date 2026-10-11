"""Conexão com o banco usada pelos endpoints."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# pool_pre_ping testa a conexão antes de usar; evita erro depois que o
# banco reinicia (comum no Docker).
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db() -> Iterator[Session]:
    """Abre uma sessão por requisição e garante que ela seja fechada.

    Uso num endpoint:
        def listar(db: Session = Depends(get_db)): ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
