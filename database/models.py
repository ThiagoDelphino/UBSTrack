"""Única definição das tabelas do UBSTrack.

Qualquer mudança na estrutura do banco começa aqui e vira uma migration:
    1. altere este arquivo
    2. alembic revision --autogenerate -m "descricao"
    3. LEIA o arquivo gerado em alembic/versions/
    4. alembic upgrade head

As APIs não importam este arquivo: elas consultam o banco com SQL
nos seus repositories/.
"""

import uuid
from datetime import date, datetime, time

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


# ---------------------------------------------------------------------------
# Tabelas usadas no MVP
# ---------------------------------------------------------------------------


class UBS(Base):
    """Unidade de saúde. abre_as e fecha_as nulos = unidade 24 horas."""

    __tablename__ = "ubs"

    id_ubs: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150))
    endereco: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float]
    longitude: Mapped[float]
    abre_as: Mapped[time | None] = mapped_column(Time)
    fecha_as: Mapped[time | None] = mapped_column(Time)

    __table_args__ = (
        # Os dois horários são preenchidos juntos ou ficam os dois nulos.
        CheckConstraint(
            "(abre_as IS NULL) = (fecha_as IS NULL)",
            name="ck_ubs_horario_completo",
        ),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_ubs_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_ubs_longitude"),
    )


class Servico(Base):
    """Tipo de atendimento. No MVP existe só "Atendimento geral"."""

    __tablename__ = "servico"

    id_servico: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True)


class UbsServico(Base):
    """Quais serviços cada unidade oferece (relação N para N)."""

    __tablename__ = "ubs_servico"

    id_ubs: Mapped[int] = mapped_column(ForeignKey("ubs.id_ubs"), primary_key=True)
    id_servico: Mapped[int] = mapped_column(
        ForeignKey("servico.id_servico"), primary_key=True
    )


class Atendimento(Base):
    """Uma senha retirada numa unidade. Só o simulador escreve aqui."""

    __tablename__ = "atendimento"

    id_atendimento: Mapped[int] = mapped_column(primary_key=True)
    id_ubs: Mapped[int] = mapped_column(ForeignKey("ubs.id_ubs"))
    id_servico: Mapped[int] = mapped_column(ForeignKey("servico.id_servico"))
    # Nulo no MVP (senha anônima). Preparado para quando houver login.
    id_user: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuario.id_user"))
    codigo_senha: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), server_default="aguardando")
    entrada: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    inicio_atendimento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fim_atendimento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        # Status possíveis de uma senha (regra de negócio 1 do guia).
        CheckConstraint(
            "status IN ('aguardando', 'em_atendimento', 'finalizado', 'desistiu')",
            name="ck_atendimento_status",
        ),
        # O painel sempre busca "senhas de uma unidade com tal status".
        Index("ix_atendimento_ubs_status", "id_ubs", "status"),
    )


# ---------------------------------------------------------------------------
# Tabelas preparadas para o futuro (login). Existem no banco, sem uso no MVP.
# ---------------------------------------------------------------------------


class Usuario(Base):
    """Cidadão ou funcionário com login.

    O nome é "usuario" e não "user" porque USER é palavra reservada
    do PostgreSQL.
    """

    __tablename__ = "usuario"

    id_user: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cpf: Mapped[str] = mapped_column(String(11), unique=True)
    nome: Mapped[str] = mapped_column(String(150))
    data_nascimento: Mapped[date] = mapped_column(Date)

    __table_args__ = (
        CheckConstraint("cpf ~ '^[0-9]{11}$'", name="ck_usuario_cpf_11_digitos"),
    )


class Funcionario(Base):
    """Vínculo de um usuário com uma unidade, com o nível de acesso."""

    __tablename__ = "funcionario"

    id_user: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuario.id_user"), primary_key=True
    )
    id_ubs: Mapped[int] = mapped_column(ForeignKey("ubs.id_ubs"), primary_key=True)
    nivel: Mapped[str] = mapped_column(String(20))

    __table_args__ = (
        CheckConstraint("nivel IN ('atendente', 'gestor')", name="ck_funcionario_nivel"),
    )
