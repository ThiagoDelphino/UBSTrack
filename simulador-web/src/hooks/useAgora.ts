import { useEffect, useState } from 'react'

/** Devolve a hora atual e atualiza a cada segundo (relógio da tela de chamada). */
export function useAgora(): Date {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return agora
}
