"""cria roles de acesso das APIs

Cria dois usuários de banco, um para cada API:
- painel_leitura: só SELECT. O painel não consegue alterar dados nem por engano.
- simulador_escrita: SELECT em tudo + INSERT/UPDATE em atendimento.

As senhas vêm das variáveis de ambiente PAINEL_DB_PASSWORD e
SIMULADOR_DB_PASSWORD (definidas no .env).

Revision ID: 7c1e4b2a9d3f
Revises: 2f7218d375ac
Create Date: 2026-10-11 19:40:00

"""
import os
from typing import Sequence, Union

from alembic import op


revision: str = "7c1e4b2a9d3f"
down_revision: Union[str, Sequence[str], None] = "2f7218d375ac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _senha(variavel: str) -> str:
    valor = os.environ.get(variavel)
    if not valor:
        raise RuntimeError(f"Defina a variável {variavel} antes de rodar as migrations.")
    # Comandos de criação de usuário não aceitam parâmetros, então a senha
    # entra no texto do SQL. Duplicar o apóstrofo evita quebrar o comando.
    return valor.replace("'", "''")


def _criar_ou_atualizar_role(nome: str, senha: str) -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{nome}') THEN
                CREATE ROLE {nome} LOGIN PASSWORD '{senha}';
            ELSE
                ALTER ROLE {nome} LOGIN PASSWORD '{senha}';
            END IF;
        END
        $$;
        """
    )


def upgrade() -> None:
    _criar_ou_atualizar_role("painel_leitura", _senha("PAINEL_DB_PASSWORD"))
    _criar_ou_atualizar_role("simulador_escrita", _senha("SIMULADOR_DB_PASSWORD"))

    for role in ("painel_leitura", "simulador_escrita"):
        op.execute(f'GRANT CONNECT ON DATABASE "{op.get_bind().engine.url.database}" TO {role}')
        op.execute(f"GRANT USAGE ON SCHEMA public TO {role}")
        op.execute(f"GRANT SELECT ON ALL TABLES IN SCHEMA public TO {role}")
        # Tabelas criadas em migrations futuras também ficam legíveis.
        op.execute(
            f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO {role}"
        )

    # Só o simulador escreve, e só na tabela de atendimentos.
    op.execute("GRANT INSERT, UPDATE ON atendimento TO simulador_escrita")
    # Necessário para o INSERT gerar o próximo id_atendimento.
    op.execute("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO simulador_escrita")


def downgrade() -> None:
    for role in ("painel_leitura", "simulador_escrita"):
        op.execute(f"DROP OWNED BY {role}")
        op.execute(f"DROP ROLE IF EXISTS {role}")
