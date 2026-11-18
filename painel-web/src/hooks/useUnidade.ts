import { buscarUnidade } from '../services/unidadesService'
import type { Coordenadas, Unidade } from '../types/unidade'
import { useBuscaPeriodica } from './useBuscaPeriodica'

const INTERVALO_MS = 30_000

/** Uma unidade só (tela de detalhe), atualizada sozinha a cada 30 s. */
export function useUnidade(id: number, coords: Coordenadas | null) {
  const chave = `${id}:${coords ? `${coords.lat},${coords.lon}` : 'sem-localizacao'}`
  return useBuscaPeriodica<Unidade>((sinal) => buscarUnidade(id, coords, sinal), chave, INTERVALO_MS)
}
