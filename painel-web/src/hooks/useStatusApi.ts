import { useEffect, useState } from 'react'
import { buscarStatusApi } from '../services/healthService'

export type EstadoConexao = 'carregando' | 'conectada' | 'indisponivel'

const INTERVALO_MS = 30_000

/** Verifica se a API está no ar (e confere de novo a cada 30 s). */
export function useStatusApi(): EstadoConexao {
  const [estado, setEstado] = useState<EstadoConexao>('carregando')

  useEffect(() => {
    let ativo = true
    const controle = new AbortController()

    function verificar() {
      buscarStatusApi(controle.signal)
        .then(() => ativo && setEstado('conectada'))
        .catch(() => ativo && setEstado('indisponivel'))
    }

    verificar()
    const id = window.setInterval(verificar, INTERVALO_MS)
    // Evita atualizar o estado se o componente já saiu da tela.
    return () => {
      ativo = false
      controle.abort()
      window.clearInterval(id)
    }
  }, [])

  return estado
}
