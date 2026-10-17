import { useEffect, useState } from 'react'
import { buscarStatusApi } from '../services/healthService'

export type EstadoConexao = 'carregando' | 'conectada' | 'indisponivel'

/** Verifica se a API está no ar. Exemplo do padrão página -> hook -> service. */
export function useStatusApi(): EstadoConexao {
  const [estado, setEstado] = useState<EstadoConexao>('carregando')

  useEffect(() => {
    let ativo = true
    buscarStatusApi()
      .then(() => ativo && setEstado('conectada'))
      .catch(() => ativo && setEstado('indisponivel'))
    // Evita atualizar o estado se o componente já saiu da tela.
    return () => {
      ativo = false
    }
  }, [])

  return estado
}
