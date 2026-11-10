import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../services/api'
import { executarRodada } from '../services/rodadaAutomatica'
import {
  CONTADORES_ZERADOS,
  SimulacaoContext,
  type Contadores,
  type EventoRegistro,
  type NovoEvento,
  type Simulacao,
  type TipoEvento,
} from './simulacao'

const CAMPO_DO_CONTADOR: Record<TipoEvento, keyof Contadores> = {
  retirada: 'retiradas',
  chamada: 'chamadas',
  finalizacao: 'finalizacoes',
  desistencia: 'desistencias',
  erro: 'erros',
}

const LIMITE_REGISTRO = 30

/** Guarda o modo automático, o registro de ações e o "aviso de mudança" para todas as telas. */
export function SimulacaoProvider({ children }: { children: ReactNode }) {
  const [automaticoAtivo, setAutomaticoAtivo] = useState(false)
  const [intervaloS, setIntervaloS] = useState(5)
  const [contadores, setContadores] = useState<Contadores>(CONTADORES_ZERADOS)
  const [registro, setRegistro] = useState<EventoRegistro[]>([])
  const [versao, setVersao] = useState(0)
  const proximoId = useRef(1)

  const registrar = useCallback((evento: NovoEvento) => {
    const novo: EventoRegistro = { ...evento, id: proximoId.current++, hora: new Date() }
    setRegistro((atual) => [novo, ...atual].slice(0, LIMITE_REGISTRO))
    if (evento.origem === 'automatico') {
      const campo = CAMPO_DO_CONTADOR[evento.tipo]
      setContadores((atual) => ({ ...atual, [campo]: atual[campo] + 1 }))
    }
  }, [])

  const avisarMudanca = useCallback(() => setVersao((v) => v + 1), [])

  useEffect(() => {
    if (!automaticoAtivo) return
    let ativo = true
    let ocupado = false // evita uma rodada começar antes da anterior terminar

    async function rodar() {
      if (ocupado) return
      ocupado = true
      try {
        await executarRodada(registrar)
      } catch (e) {
        const motivo = e instanceof ApiError ? e.message : 'erro inesperado'
        registrar({ tipo: 'erro', origem: 'automatico', texto: `Rodada falhou: ${motivo}` })
      } finally {
        ocupado = false
        if (ativo) setVersao((v) => v + 1)
      }
    }

    void rodar()
    const id = window.setInterval(() => void rodar(), intervaloS * 1000)
    return () => {
      ativo = false
      window.clearInterval(id)
    }
  }, [automaticoAtivo, intervaloS, registrar])

  const valor = useMemo<Simulacao>(
    () => ({
      automaticoAtivo,
      intervaloS,
      contadores,
      registro,
      versao,
      ligarAutomatico: () => setAutomaticoAtivo(true),
      desligarAutomatico: () => setAutomaticoAtivo(false),
      mudarIntervalo: setIntervaloS,
      registrar,
      avisarMudanca,
    }),
    [automaticoAtivo, intervaloS, contadores, registro, versao, registrar, avisarMudanca],
  )

  return <SimulacaoContext.Provider value={valor}>{children}</SimulacaoContext.Provider>
}
