"""Formato das respostas do modo automático."""
from datetime import datetime

from pydantic import BaseModel, Field


class AutomaticoEstado(BaseModel):
    ativo: bool
    intervalo_s: float | None = Field(description="Segundos entre rodadas (None se parado)")
    rodadas: int = Field(description="Rodadas executadas desde que foi iniciado")
    erros: int = Field(description="Rodadas de unidade que falharam (o modo continua rodando)")
    iniciado_em: datetime | None
    ultima_rodada_em: datetime | None
    acoes: dict[str, int] = Field(description="Total por ação: retirada, chamada, finalizacao, desistencia")
