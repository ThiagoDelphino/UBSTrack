"""Formato das respostas da API. O front espelha isto em src/types/unidade.ts."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UnidadeResponse(BaseModel):
    posicao: int | None = Field(None, description="1º, 2º, 3º... Nulo se fechada (ou no detalhe)")
    id: int
    nome: str
    endereco: str | None
    latitude: float
    longitude: float
    distancia_km: float | None = Field(None, description="Nulo se o cidadão não enviou localização")
    deslocamento_min: int | None = Field(None, description="Aproximado, em linha reta")
    fila: int = Field(description="Senhas aguardando")
    espera_min: int = Field(description="Espera estimada (aprox.)")
    tempo_total_min: int | None = Field(None, description="Deslocamento + espera")
    situacao: Literal["baixa", "moderada", "alta"]
    aberta: bool
    atualizado_em: datetime | None
    atualizado_ha_min: int | None
    desatualizado: bool


class HealthResponse(BaseModel):
    status: Literal["ok", "erro"]
    database: Literal["ok", "erro"]
