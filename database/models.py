from sqlalchemy import String, Float, ForeignKey, DateTime, Time, Date, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, time

from app.database import Base

class UBS(Base):
    __tablename__ = "ubs"

    id_ubs:Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150))
    endereco: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    abre_as: Mapped[time] = mapped_column(Time)
    fecha_as: Mapped[time] = mapped_column(Time)

    atendimentos: Mapped[list["Atendimento"]] = relationship(back_populates="ubs")

class Servico(Base):
    __tablename__ = "servico"

    id_servico : Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), unique = True)


class Atendimento(Base):
    __tablename__ = "atendimento"

    id: Mapped[int] = mapped_column(primary_key=True)
    id_ubs: Mapped[int] = mapped_column(ForeignKey("ubs.id"))
    servico_id: Mapped[int] = mapped_column(ForeignKey("servico.id"))
    id_servico: Mapped[int] = mapped_column(ForeignKey("user.id"))
    codigo_senha: Mapped[str] = mapped_column(String(4))
    status: Mapped[str] = mapped_column(String(20))
    chegada_prevista: Mapped[datetime] = mapped_column(DateTime)
    entrada: Mapped[datetime | None] = mapped_column(DateTime)
    inicio_atendimento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fim_atendimento: Mapped[datetime | None] = mapped_column(DateTime,nullable = True)

    ubs: Mapped["UBS"] = relationship(back_populates="atendimentos")

class UBS_SERVICO(Base):
    __tablename__ = "ubs_servico"

    id_ubs : Mapped[int] = mapped_column(ForeignKey("ubs.id_ubs"), primary_key = True)
    id_servico : Mapped[int] = mapped_column(ForeignKey("servico.id_servico"), primary_key = True)


class User(Base):
    __tablename__ = "user"

    id_user: Mapped[int] = mapped_column(primary_key = True)
    cpf: Mapped[str] = mapped_column(String(11), unique = True)
    nome: Mapped[str] = mapped_column(String(150))
    data_nascimento: Mapped[date] = mapped_column(Date)

    __table_args__ = (CheckConstraint("cpf ~ '^[0-9]{11}$'", name="ck_usuario_cpf_11_digitos"),)
    

class Funcionario(Base):
    __tablename__ = "funcionario"
    
    id_user:Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id_user"), primary_key = True)
    id_ubs:Mapped[int] = mapped_column(ForeignKey("ubs.id_ubs"), primary_key = True)
    nivel: Mapped[str] = mapped_column(String(20))

    __table_args__ = (CheckConstraint("nivel IN ('atendente', 'gestor')", name="ck_funcionario_nivel"),)