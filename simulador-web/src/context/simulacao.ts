import { createContext, useContext } from 'react'

export type TipoEvento = 'retirada' | 'chamada' | 'finalizacao' | 'desistencia' | 'erro'

export interface EventoRegistro {
  id: number
  hora: Date
  tipo: TipoEvento
  origem: 'manual' | 'automatico'
  texto: string
}

export type NovoEvento = Omit<EventoRegistro, 'id' | 'hora'>

export interface Contadores {
  retiradas: number
  chamadas: number
  finalizacoes: number
  desistencias: number
  erros: number
}

export const CONTADORES_ZERADOS: Contadores = {
  retiradas: 0,
  chamadas: 0,
  finalizacoes: 0,
  desistencias: 0,
  erros: 0,
}

export interface Simulacao {
  automaticoAtivo: boolean
  /** Segundos entre uma rodada e outra do modo automático. */
  intervaloS: number
  /** Total de ações do modo automático desde que a página foi aberta. */
  contadores: Contadores
  /** Últimas ações (manuais e automáticas), da mais nova para a mais antiga. */
  registro: EventoRegistro[]
  /** Sobe a cada mudança nas filas: as telas usam para buscar os dados de novo na hora. */
  versao: number
  ligarAutomatico: () => void
  desligarAutomatico: () => void
  mudarIntervalo: (segundos: number) => void
  registrar: (evento: NovoEvento) => void
  avisarMudanca: () => void
}

export const SimulacaoContext = createContext<Simulacao | null>(null)

/** Estado da simulação compartilhado entre as telas (o modo automático segue ligado ao trocar de tela). */
export function useSimulacao(): Simulacao {
  const contexto = useContext(SimulacaoContext)
  if (!contexto) throw new Error('useSimulacao precisa estar dentro de <SimulacaoProvider>.')
  return contexto
}
