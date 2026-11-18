/** Funções que transformam números da API em texto para a tela. */

export function formatarMinutos(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')} min`
}

/** Estimativas sempre aparecem como "aprox.", nunca como horário exato (regra 4). */
export function formatarAprox(minutos: number): string {
  return `aprox. ${formatarMinutos(minutos)}`
}

export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
}

export function formatarPessoas(quantidade: number): string {
  if (quantidade === 0) return 'Sem fila'
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

export function formatarHaMinutos(minutos: number): string {
  if (minutos < 1) return 'agora há pouco'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return horas < 24 ? `há ${horas} h` : `há ${Math.floor(horas / 24)} d`
}

export function formatarHora(data: Date): string {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function ordinal(posicao: number): string {
  return `${posicao}º`
}
