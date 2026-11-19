import { apiGet } from './api'
import type { Coordenadas, Unidade } from '../types/unidade'

function comLocalizacao(caminho: string, coords: Coordenadas | null): string {
  if (!coords) return caminho
  return `${caminho}?lat=${coords.lat}&lon=${coords.lon}`
}

/** Lista já ordenada e numerada pela API. Sem coordenadas, ordena só pela espera. */
export function listarUnidades(coords: Coordenadas | null, sinal?: AbortSignal): Promise<Unidade[]> {
  return apiGet<Unidade[]>(comLocalizacao('/unidades', coords), sinal)
}

export function buscarUnidade(
  id: number,
  coords: Coordenadas | null,
  sinal?: AbortSignal,
): Promise<Unidade> {
  return apiGet<Unidade>(comLocalizacao(`/unidades/${id}`, coords), sinal)
}
