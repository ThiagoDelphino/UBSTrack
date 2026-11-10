import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulacao, type TipoEvento } from '../context/simulacao'
import { ApiError } from '../services/api'

export interface MensagemAcao {
  tipo: 'ok' | 'erro'
  texto: string
}

/**
 * Executa uma ação do operador (retirar, chamar, finalizar, desistir):
 * bloqueia clique duplo, guarda a mensagem de sucesso/erro, registra no histórico
 * e avisa as telas para buscarem a fila de novo.
 */
export function useAcoesFila() {
  const { registrar, avisarMudanca } = useSimulacao()
  const [pendente, setPendente] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<MensagemAcao | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  const mostrar = useCallback((nova: MensagemAcao) => {
    setMensagem(nova)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setMensagem(null), 5000)
  }, [])

  /** `fazer` chama o service e devolve o texto de sucesso. */
  const executar = useCallback(
    async (chave: string, tipo: TipoEvento, fazer: () => Promise<string>) => {
      if (pendente) return
      setPendente(chave)
      try {
        const texto = await fazer()
        registrar({ tipo, origem: 'manual', texto })
        mostrar({ tipo: 'ok', texto })
      } catch (e) {
        const texto = e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo.'
        registrar({ tipo: 'erro', origem: 'manual', texto })
        mostrar({ tipo: 'erro', texto })
      } finally {
        setPendente(null)
        avisarMudanca()
      }
    },
    [pendente, registrar, avisarMudanca, mostrar],
  )

  return { executar, pendente, mensagem }
}
