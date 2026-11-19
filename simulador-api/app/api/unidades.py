"""Endpoints do operador. Só valida a entrada e devolve JSON: nada de regra de negócio aqui."""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.senha import FilaResponse, SenhaResponse, UnidadeResumo
from app.services import simulador_service

router = APIRouter(tags=["unidades"])

IdUbs = Path(gt=0, description="Identificador da unidade")


@router.get("/unidades", response_model=list[UnidadeResumo])
def listar_unidades(db: Session = Depends(get_db)):
    """Lista as unidades para o operador escolher."""
    return simulador_service.listar_unidades(db)


@router.get("/unidades/{id_ubs}/fila", response_model=FilaResponse)
def estado_da_fila(id_ubs: int = IdUbs, db: Session = Depends(get_db)):
    """Estado atual da fila da unidade."""
    try:
        return simulador_service.estado_da_fila(db, id_ubs)
    except simulador_service.UnidadeNaoEncontrada:
        raise HTTPException(status_code=404, detail="Unidade não encontrada.")


@router.post("/unidades/{id_ubs}/senhas", response_model=SenhaResponse, status_code=201)
def retirar_senha(id_ubs: int = IdUbs, db: Session = Depends(get_db)):
    """Retira uma senha: status `aguardando`, código sequencial do dia (A-001, A-002...) e horário de entrada."""
    try:
        return simulador_service.retirar_senha(db, id_ubs)
    except simulador_service.UnidadeNaoEncontrada:
        raise HTTPException(status_code=404, detail="Unidade não encontrada.")
    except simulador_service.UnidadeSemServico:
        raise HTTPException(status_code=409, detail="Unidade sem serviço cadastrado.")
