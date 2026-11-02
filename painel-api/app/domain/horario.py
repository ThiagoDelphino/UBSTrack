"""Unidade aberta ou fechada."""
from datetime import time


def esta_aberta(agora: time, abre_as: time | None, fecha_as: time | None) -> bool:
    if abre_as is None and fecha_as is None:
        return True  # nulo nos dois = unidade 24 horas
    if abre_as is None or fecha_as is None:
        return False  # cadastro inconsistente: não arrisca dizer que está aberta
    if abre_as <= fecha_as:
        return abre_as <= agora < fecha_as
    return agora >= abre_as or agora < fecha_as  # horário que atravessa a meia-noite
