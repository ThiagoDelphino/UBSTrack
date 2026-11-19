import { useSimulacao } from '../context/simulacao'
import { buscarFila, listarUnidades } from '../services/simuladorService'
import type { FilaResponse } from '../types/fila'
import { useBuscaPeriodica } from './useBuscaPeriodica'

/** Fila de todas as unidades de uma vez (tela "Visão geral"). */
export function useVisaoGeral() {
  const { versao } = useSimulacao()
  return useBuscaPeriodica<FilaResponse[]>(
    async (sinal) => {
      const unidades = await listarUnidades(sinal)
      return Promise.all(unidades.map((u) => buscarFila(u.id, sinal)))
    },
    `geral:${versao}`,
    5000,
  )
}
