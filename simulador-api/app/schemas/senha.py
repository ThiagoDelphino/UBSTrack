"""Formato das respostas da simulador-api. O front espelha isto em src/types/."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

StatusSenha = Literal["aguardando", "em_atendimento", "finalizado", "desistiu"]


class UnidadeResumo(BaseModel):
    id: int
    nome: str
    endereco: str | None


class SenhaResponse(BaseModel):
    id_atendimento: int
    id_ubs: int
    codigo_senha: str = Field(description="Sequencial por unidade e por dia: A-001, A-002...")
    status: StatusSenha
    entrada: datetime


class SenhaNaFila(BaseModel):
    id_atendimento: int
    codigo_senha: str
    status: StatusSenha
    entrada: datetime
    inicio_atendimento: datetime | None


class FilaResponse(BaseModel):
    id_ubs: int
    nome: str
    aguardando: int = Field(description="Quantidade de senhas aguardando")
    em_atendimento: int = Field(description="Quantidade de senhas em atendimento")
    senhas_aguardando: list[SenhaNaFila] = Field(description="Da mais antiga para a mais nova")
    senhas_em_atendimento: list[SenhaNaFila]
