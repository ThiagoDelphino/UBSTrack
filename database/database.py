"""Base declarativa dos models.

Este arquivo existe só para o Alembic: ele define a classe Base,
da qual todas as tabelas em models.py herdam.

Conexão com o banco, sessão e get_db NÃO ficam aqui. Quem atende
requisições são as APIs, então isso fica em core/database.py de
cada uma (painel-api e simulador-api).
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
