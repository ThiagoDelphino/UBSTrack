import { listarUnidades } from '../services/simuladorService'
import type { UnidadeResumo } from '../types/fila'
import { useBuscaPeriodica } from './useBuscaPeriodica'

/** Lista de unidades para o operador escolher (muda pouco: confere a cada minuto). */
export function useUnidadesSimulador() {
  return useBuscaPeriodica<UnidadeResumo[]>((sinal) => listarUnidades(sinal), 'unidades', 60_000)
}
