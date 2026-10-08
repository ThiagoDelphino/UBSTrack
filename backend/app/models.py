from sqlalchemy import String, Float, ForeignKey, DateTime, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, time

from app.database import Base

class UBS(Base):
    __tablename__ = "ubs"

    id:Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150))
    endereco: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    abre_as: Mapped[time] = mapped_column(Time)
    fecha_as: Mapped[time] = mapped_column(Time)

    atendimentos: Mapped[list["Atendimento"]] = relationship(back_populates="ubs")

class Servico(Base):
    __tablename__ = "servico"

    id : Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), unique = True)


class Atendimento(Base):
    __tablename__ = "atendimento"

    id: Mapped[int] = mapped_column(primary_key=True)
    ubs_id: Mapped[int] = mapped_column(ForeignKey("ubs.id"))
    servico_id: Mapped[int] = mapped_column(ForeignKey("servico.id"))
    entrada: Mapped[datetime] = mapped_column(DateTime)
    inicio_atendimento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    ubs: Mapped["UBS"] = relationship(back_populates="atendimentos")