"""Liga, desliga e consulta o modo automático (movimento simulado nas filas)."""
from fastapi import APIRouter, Query

from app.schemas.automatico import AutomaticoEstado
from app.services import automatico_service

router = APIRouter(prefix="/automatico", tags=["automatico"])


@router.get("", response_model=AutomaticoEstado)
def estado():
    """Estado atual do modo automático."""
    return automatico_service.simulacao.estado()


@router.post("/iniciar", response_model=AutomaticoEstado)
def iniciar(intervalo_s: float = Query(5, ge=1, le=60, description="Segundos entre rodadas")):
    """Inicia o modo automático. Se já estiver ativo, não muda nada (idempotente)."""
    automatico_service.simulacao.iniciar(intervalo_s)
    return automatico_service.simulacao.estado()


@router.post("/parar", response_model=AutomaticoEstado)
def parar():
    """Para o modo automático. Se já estiver parado, não muda nada (idempotente)."""
    automatico_service.simulacao.parar()
    return automatico_service.simulacao.estado()
