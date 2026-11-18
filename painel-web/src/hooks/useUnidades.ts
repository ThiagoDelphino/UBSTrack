import { listarUnidades } from '../services/unidadesService'
import type { Coordenadas, Unidade } from '../types/unidade'
import { useBuscaPeriodica } from './useBuscaPeriodica'

const INTERVALO_MS = 30_000 // o painel atualiza a cada 30 segundos

/** Lista de unidades ordenada pela API, atualizada sozinha a cada 30 s. */
export function useUnidades(coords: Coordenadas | null) {
  const chave = coords ? `${coords.lat},${coords.lon}` : 'sem-localizacao'
  return useBuscaPeriodica<Unidade[]>((sinal) => listarUnidades(coords, sinal), chave, INTERVALO_MS)
}
