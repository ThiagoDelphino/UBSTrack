"""Endpoints de atendimento. Só valida a entrada e devolve JSON: nada de regra de negócio aqui."""

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.atendimento import AtendimentoResponse
from app.services import atendimento_service as service

router = APIRouter(tags=["atendimento"])

_NAO_ENCONTRADO = {404: {"description": "Unidade sem fila ou senha inexistente"}}
_CONFLITO = {409: {"description": "O status atual da senha não permite esta ação"}}


@router.post(
    "/unidades/{id_ubs}/chamar-proximo",
    response_model=AtendimentoResponse,
    responses=_NAO_ENCONTRADO,
)
def chamar_proximo(id_ubs: int = Path(ge=1), db: Session = Depends(get_db)):
    """A senha aguardando mais antiga da unidade passa para em_atendimento."""
    try:
        return service.chamar_proximo(db, id_ubs)
    except service.FilaVazia:
        raise HTTPException(status_code=404, detail="Nenhuma senha aguardando nesta unidade.")


@router.post(
    "/atendimentos/{id_atendimento}/finalizar",
    response_model=AtendimentoResponse,
    responses={**_NAO_ENCONTRADO, **_CONFLITO},
)
def finalizar(id_atendimento: int = Path(ge=1), db: Session = Depends(get_db)):
    """Só aceita senha em_atendimento; grava o fim_atendimento."""
    try:
        return service.finalizar(db, id_atendimento)
    except service.AtendimentoNaoEncontrado:
        raise HTTPException(status_code=404, detail="Senha não encontrada.")
    except service.TransicaoInvalida as erro:
        raise HTTPException(status_code=409, detail=str(erro))


@router.post(
    "/atendimentos/{id_atendimento}/desistir",
    response_model=AtendimentoResponse,
    responses={**_NAO_ENCONTRADO, **_CONFLITO},
)
def desistir(id_atendimento: int = Path(ge=1), db: Session = Depends(get_db)):
    """Só aceita senha aguardando."""
    try:
        return service.desistir(db, id_atendimento)
    except service.AtendimentoNaoEncontrado:
        raise HTTPException(status_code=404, detail="Senha não encontrada.")
    except service.TransicaoInvalida as erro:
        raise HTTPException(status_code=409, detail=str(erro))