"""Casos de uso de atendimento. Quem escreve no banco é o repositories/atendimento.py."""

from sqlalchemy.orm import Session

from app.repositories import atendimento as repo

# Reexportadas para a camada api/ não precisar importar o repository.
FilaVazia = repo.FilaVazia
AtendimentoNaoEncontrado = repo.AtendimentoNaoEncontrado
TransicaoInvalida = repo.TransicaoInvalida


def chamar_proximo(db: Session, id_ubs: int) -> dict:
    return repo.chamar_proximo(db, id_ubs)


def finalizar(db: Session, id_atendimento: int) -> dict:
    return repo.finalizar(db, id_atendimento)


def desistir(db: Session, id_atendimento: int) -> dict:
    return repo.desistir(db, id_atendimento)