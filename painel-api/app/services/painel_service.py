"""Orquestra o caso de uso: busca nos repositórios, aplica o domain, monta a resposta."""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain import estimativa, geo, horario, ordenacao
from app.repositories import atendimento_repo, unidade_repo
from app.schemas.unidade import UnidadeResponse


class UnidadeNaoEncontrada(Exception):
    pass


def _utc(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)  # assume UTC se o banco devolver sem fuso
    return dt


def _montar(db: Session, lat: float | None, lon: float | None, id_ubs: int | None = None) -> list[UnidadeResponse]:
    agora = datetime.now(timezone.utc)
    hora_local = agora.astimezone(ZoneInfo(settings.timezone)).time()
    tem_localizacao = lat is not None and lon is not None

    unidades = unidade_repo.listar(db, id_ubs)
    filas = atendimento_repo.contar_fila(db, id_ubs)
    duracoes = atendimento_repo.ultimas_duracoes(db, settings.qtd_atendimentos_media, id_ubs)
    atualizacoes = atendimento_repo.ultima_atualizacao(db, id_ubs)

    itens: dict[int, UnidadeResponse] = {}
    ranking: list[ordenacao.ItemRanking] = []

    for u in unidades:
        uid = u["id_ubs"]
        fila = filas.get(uid, 0)
        media = estimativa.tempo_medio_min(duracoes.get(uid, []), settings.tempo_padrao_min)
        espera = estimativa.espera_estimada_min(fila, media)
        atualizado_em = _utc(atualizacoes.get(uid))
        desatualizado = estimativa.esta_desatualizado(atualizado_em, agora, settings.dado_desatualizado_min)
        aberta = horario.esta_aberta(hora_local, u["abre_as"], u["fecha_as"])

        distancia = deslocamento = total = None
        if tem_localizacao:
            distancia = geo.distancia_km(lat, lon, float(u["latitude"]), float(u["longitude"]))
            deslocamento = geo.deslocamento_min(distancia, settings.velocidade_media_kmh)
            total = deslocamento + espera

        itens[uid] = UnidadeResponse(
            id=uid,
            nome=u["nome"],
            endereco=u["endereco"],
            latitude=float(u["latitude"]),
            longitude=float(u["longitude"]),
            distancia_km=round(distancia, 2) if distancia is not None else None,
            deslocamento_min=round(deslocamento) if deslocamento is not None else None,
            fila=fila,
            espera_min=round(espera),
            tempo_total_min=round(total) if total is not None else None,
            situacao=estimativa.situacao_fila(
                espera, settings.limite_fila_baixa_min, settings.limite_fila_moderada_min
            ),
            aberta=aberta,
            atualizado_em=atualizado_em,
            atualizado_ha_min=estimativa.minutos_desde(atualizado_em, agora),
            desatualizado=desatualizado,
        )
        ranking.append(
            ordenacao.ItemRanking(
                id=uid,
                nome=u["nome"],
                aberta=aberta,
                desatualizada=desatualizado,
                tempo_min=total if total is not None else espera,  # sem GPS: só a espera
            )
        )

    resultado = []
    for uid, posicao in ordenacao.ordenar_e_numerar(ranking):
        item = itens[uid]
        item.posicao = posicao
        resultado.append(item)
    return resultado


def listar_unidades(db: Session, lat: float | None, lon: float | None) -> list[UnidadeResponse]:
    return _montar(db, lat, lon)


def obter_unidade(db: Session, id_ubs: int, lat: float | None, lon: float | None) -> UnidadeResponse:
    itens = _montar(db, lat, lon, id_ubs)
    if not itens:
        raise UnidadeNaoEncontrada(id_ubs)
    item = itens[0]
    item.posicao = None  # a posição só faz sentido dentro da lista completa
    return item
