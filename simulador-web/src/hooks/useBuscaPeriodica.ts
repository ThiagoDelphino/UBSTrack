import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../services/api'

export interface ResultadoBusca<T> {
  dados: T | null
  erro: ApiError | null
  /** Primeira carga ainda em andamento (sem nada para mostrar). */
  carregando: boolean
  /** Atualizando em segundo plano (já há dados na tela). */
  recarregando: boolean
  atualizadoEm: Date | null
  recarregar: () => void
}

/**
 * Busca um dado e repete a busca de tempos em tempos (polling).
 * Se uma atualização falhar, os dados antigos continuam na tela e `erro` é preenchido.
 * `chave` identifica "o que está sendo buscado": quando muda, busca de novo.
 */
export function useBuscaPeriodica<T>(
  buscar: (sinal: AbortSignal) => Promise<T>,
  chave: string,
  intervaloMs: number,
): ResultadoBusca<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<ApiError | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const [versao, setVersao] = useState(0)

  // Guarda a função mais recente sem reiniciar o intervalo a cada render.
  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    let ativo = true
    const controle = new AbortController()

    async function executar() {
      setRecarregando(true)
      try {
        const resultado = await buscarRef.current(controle.signal)
        if (!ativo) return
        setDados(resultado)
        setErro(null)
        setAtualizadoEm(new Date())
      } catch (e) {
        if (!ativo) return
        setErro(e instanceof ApiError ? e : new ApiError(0, 'Não foi possível conectar à API.'))
      } finally {
        if (ativo) {
          setCarregando(false)
          setRecarregando(false)
        }
      }
    }

    void executar()
    const id = window.setInterval(() => void executar(), intervaloMs)
    return () => {
      ativo = false
      controle.abort()
      window.clearInterval(id)
    }
  }, [chave, intervaloMs, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  return { dados, erro, carregando, recarregando, atualizadoEm, recarregar }
}
