"""Tempo médio, espera estimada, situação da fila e dado desatualizado."""
from collections.abc import Sequence
from datetime import datetime
from typing import Literal

Situacao = Literal["baixa", "moderada", "alta"]


def tempo_medio_min(duracoes_min: Sequence[float], padrao_min: float) -> float:
    """Média dos últimos atendimentos; sem histórico, usa o tempo padrão."""
    if not duracoes_min:
        return padrao_min
    return sum(duracoes_min) / len(duracoes_min)


def espera_estimada_min(fila: int, tempo_medio: float) -> float:
    return fila * tempo_medio


def situacao_fila(espera_min: float, limite_baixa: float, limite_moderada: float) -> Situacao:
    """Até 30 min: baixa | de 30 a 90: moderada | acima de 90: alta."""
    if espera_min <= limite_baixa:
        return "baixa"
    if espera_min <= limite_moderada:
        return "moderada"
    return "alta"


def minutos_desde(atualizado_em: datetime | None, agora: datetime) -> int | None:
    if atualizado_em is None:
        return None
    return max(0, int((agora - atualizado_em).total_seconds() // 60))


def esta_desatualizado(atualizado_em: datetime | None, agora: datetime, limite_min: int) -> bool:
    """Sem nenhum registro de movimento também conta como desatualizado."""
    minutos = minutos_desde(atualizado_em, agora)
    return minutos is None or minutos > limite_min
