"""Orquestra os casos de uso do simulador: busca nos repositórios, aplica o domain, monta a resposta."""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain import senha
from app.repositories import atendimento_repo, unidade_repo
from app.schemas.senha import FilaResponse, SenhaNaFila, SenhaResponse, UnidadeResumo


class UnidadeNaoEncontrada(Exception):
    pass


class UnidadeSemServico(Exception):
    pass


def _unidade_ou_erro(db: Session, id_ubs: int) -> dict:
    unidade = unidade_repo.obter(db, id_ubs)
    if unidade is None:
        raise UnidadeNaoEncontrada(id_ubs)
    return unidade


def listar_unidades(db: Session) -> list[UnidadeResumo]:
    return [
        UnidadeResumo(id=u["id_ubs"], nome=u["nome"], endereco=u["endereco"])
        for u in unidade_repo.listar(db)
    ]


def estado_da_fila(db: Session, id_ubs: int) -> FilaResponse:
    unidade = _unidade_ou_erro(db, id_ubs)
    senhas = [SenhaNaFila(**linha) for linha in atendimento_repo.listar_fila(db, id_ubs)]
    aguardando = [s for s in senhas if s.status == "aguardando"]
    em_atendimento = [s for s in senhas if s.status == "em_atendimento"]
    return FilaResponse(
        id_ubs=id_ubs,
        nome=unidade["nome"],
        aguardando=len(aguardando),
        em_atendimento=len(em_atendimento),
        senhas_aguardando=aguardando,
        senhas_em_atendimento=em_atendimento,
    )


def retirar_senha(db: Session, id_ubs: int) -> SenhaResponse:
    _unidade_ou_erro(db, id_ubs)
    id_servico = unidade_repo.primeiro_servico(db, id_ubs)
    if id_servico is None:
        raise UnidadeSemServico(id_ubs)

    # A trava, a leitura do maior número e o INSERT acontecem na mesma transação.
    atendimento_repo.travar_geracao_de_codigo(db, id_ubs)
    maior = atendimento_repo.maior_numero_do_dia(db, id_ubs, settings.timezone)
    codigo = senha.formatar_codigo(senha.proximo_numero(maior))
    criada = atendimento_repo.inserir_senha(db, id_ubs, id_servico, codigo)
    db.commit()
    return SenhaResponse(**criada)
