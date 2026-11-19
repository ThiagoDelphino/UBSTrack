/** Funções que transformam números e datas da API em texto para a tela. */

export function formatarHora(data: Date): string {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatarHoraCurta(data: Date): string {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** "há 3 min", "há 1 h 05 min". Recebe o horário ISO que veio da API. */
export function haQuanto(iso: string, agora: number = Date.now()): string {
  const minutos = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60_000))
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `há ${horas} h` : `há ${horas} h ${String(resto).padStart(2, '0')} min`
}

export function formatarPessoas(quantidade: number): string {
  if (quantidade === 0) return 'ninguém'
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}
