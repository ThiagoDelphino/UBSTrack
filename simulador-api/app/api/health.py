from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    """Mostra se a API está no ar e se consegue falar com o banco."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as erro:
        raise HTTPException(status_code=503, detail="Banco de dados indisponível") from erro
    return {"status": "ok", "banco": "ok"}
