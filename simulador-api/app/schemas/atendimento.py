"""Formato da resposta dos endpoints de atendimento."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AtendimentoResponse(BaseModel):
    id_atendimento: int
    id_ubs: int
    id_servico: int
    codigo_senha: str = Field(description="Ex.: A-001")
    status: Literal["aguardando", "em_atendimento", "finalizado", "desistiu"]
    entrada: datetime
    inicio_atendimento: datetime | None
    fim_atendimento: datetime | None = Field(
        None, description="Fim do atendimento ou, se a pessoa desistiu, horário da desistência"
    )