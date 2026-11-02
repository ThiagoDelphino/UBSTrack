"""Ordena e numera as unidades.

Grupos, nesta ordem:
  0. abertas com dado recente       -> numeradas pelo tempo (menor primeiro)
  1. abertas com dado desatualizado -> vão para o fim da lista, ainda numeradas
  2. fechadas                       -> aparecem, mas sem posição
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class ItemRanking:
    id: int
    nome: str
    aberta: bool
    desatualizada: bool
    tempo_min: float  # tempo total (com localização) ou só a espera (sem localização)


def _chave(item: ItemRanking) -> tuple:
    grupo = 2 if not item.aberta else (1 if item.desatualizada else 0)
    return (grupo, item.tempo_min, item.nome.lower(), item.id)


def ordenar_e_numerar(itens: list[ItemRanking]) -> list[tuple[int, int | None]]:
    """Devolve [(id, posicao)] já na ordem de exibição; posicao é None para fechadas."""
    resultado: list[tuple[int, int | None]] = []
    posicao = 0
    for item in sorted(itens, key=_chave):
        if item.aberta:
            posicao += 1
            resultado.append((item.id, posicao))
        else:
            resultado.append((item.id, None))
    return resultado
