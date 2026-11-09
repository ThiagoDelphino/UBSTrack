"""Tratamento global de exceções: respostas de erro sempre no formato {"detail": ...}."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

logger = logging.getLogger("ubstrack")


async def _validacao(_: Request, exc: RequestValidationError) -> JSONResponse:
    erros = [
        {"campo": ".".join(str(p) for p in e["loc"] if p not in ("query", "path", "body")),
         "mensagem": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": "Parâmetros inválidos.", "erros": erros})


async def _banco_indisponivel(_: Request, exc: OperationalError) -> JSONResponse:
    logger.error("Banco indisponível: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Banco de dados indisponível. Tente novamente em instantes."},
    )


async def _inesperado(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Erro inesperado", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Erro interno. Tente novamente."})


def registrar_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, _validacao)
    app.add_exception_handler(OperationalError, _banco_indisponivel)
    app.add_exception_handler(Exception, _inesperado)
