"""Distância em linha reta (Haversine) e tempo de deslocamento."""
from math import asin, cos, radians, sin, sqrt

RAIO_TERRA_KM = 6371.0088


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * RAIO_TERRA_KM * asin(sqrt(a))


def deslocamento_min(distancia: float, velocidade_kmh: float) -> float:
    if velocidade_kmh <= 0:
        raise ValueError("velocidade_kmh deve ser maior que zero")
    return distancia / velocidade_kmh * 60
