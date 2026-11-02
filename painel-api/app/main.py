from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import unidades
from app.core.config import settings

app = FastAPI(
    title="UBSTrack — painel-api",
    version="0.1.0",
    description="Leitura e cálculos do painel. Estimativas não garantem atendimento. Em emergência, ligue 192 (SAMU).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_lista,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(unidades.router)
