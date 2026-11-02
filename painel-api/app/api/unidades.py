"""Endpoints. Só valida a entrada e devolve JSON: nada de regra de negócio aqui."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.unidade import HealthResponse, UnidadeResponse
from app.services import painel_service

router = APIRouter()


def _validar_localizacao(lat: float | None, lon: float | None) -> None:
    if (lat is None) != (lon is None):
        raise HTTPException(status_code=422, detail="Envie lat e lon juntas, ou nenhuma das duas.")


@router.get("/unidades", response_model=list[UnidadeResponse], tags=["unidades"])
def listar_unidades(
    lat: float | None = Query(None, ge=-90, le=90),
    lon: float | None = Query(None, ge=-180, le=180),
    db: Session = Depends(get_db),
):
    """Lista ordenada e numerada. Sem lat/lon, ordena só pela espera."""
    _validar_localizacao(lat, lon)
    return painel_service.listar_unidades(db, lat, lon)


@router.get("/unidades/{id_ubs}", response_model=UnidadeResponse, tags=["unidades"])
def detalhe_unidade(
    id_ubs: int,
    lat: float | None = Query(None, ge=-90, le=90),
    lon: float | None = Query(None, ge=-180, le=180),
    db: Session = Depends(get_db),
):
    _validar_localizacao(lat, lon)
    try:
        return painel_service.obter_unidade(db, id_ubs, lat, lon)
    except painel_service.UnidadeNaoEncontrada:
        raise HTTPException(status_code=404, detail="Unidade não encontrada.")


@router.get("/health", response_model=HealthResponse, tags=["infra"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail={"status": "erro", "database": "erro"})
    return HealthResponse(status="ok", database="ok")
