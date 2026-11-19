import { useSimulacao } from '../context/simulacao'
import { buscarFila } from '../services/simuladorService'
import type { FilaResponse } from '../types/fila'
import { useBuscaPeriodica } from './useBuscaPeriodica'

/**
 * Fila de uma unidade. Atualiza sozinha e também na hora em que qualquer ação
 * (manual ou do modo automático) muda alguma fila.
 */
export function useFila(idUbs: number, intervaloMs = 4000) {
  const { versao } = useSimulacao()
  const resultado = useBuscaPeriodica<FilaResponse>(
    (sinal) => buscarFila(idUbs, sinal),
    `${idUbs}:${versao}`,
    intervaloMs,
  )
  // Ao trocar de unidade, os dados da anterior ficam por um instante: não os mostre como se fossem da nova.
  const dados = resultado.dados && resultado.dados.id_ubs === idUbs ? resultado.dados : null
  return { ...resultado, dados, carregando: resultado.carregando || (resultado.dados !== null && dados === null) }
}
