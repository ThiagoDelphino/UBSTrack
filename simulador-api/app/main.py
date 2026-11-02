"""Ponto de entrada da simulador-api.

Este arquivo só cria o app e registra as rotas. As regras de transição
de status (aguardando -> em_atendimento -> finalizado) ficam em
app/domain/, não aqui.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health
from app.core.config import settings

app = FastAPI(
    title="UBSTrack — API do simulador",
    description="Simula a fila de uma unidade: retirar senha, chamar, finalizar e desistir.",
    version="0.1.0",
)

# O navegador bloqueia chamadas de um endereço (o front, porta 5174)
# para outro (a API, porta 8001) se a API não autorizar. Isso é o CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_lista,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
# Próximos passos: criar app/api/senhas.py e app/api/atendimentos.py e registrar aqui.
