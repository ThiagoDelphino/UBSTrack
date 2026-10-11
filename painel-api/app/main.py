"""Ponto de entrada da painel-api.

Este arquivo só cria o app e registra as rotas. Nenhuma regra de
negócio fica aqui.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health
from app.core.config import settings

app = FastAPI(
    title="UBSTrack — API do painel",
    description="Lê as filas e devolve as unidades ordenadas por tempo total estimado.",
    version="0.1.0",
)

# O navegador bloqueia chamadas de um endereço (o front, porta 5173)
# para outro (a API, porta 8000) se a API não autorizar. Isso é o CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_lista,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
# Próximo passo: criar app/api/unidades.py e registrar aqui:
# app.include_router(unidades.router)
