/**
 * Regra do modo automático: dado o estado da fila, escolhe a próxima ação.
 * Função pura (recebe o "sorteio" como parâmetro) para dar para testar sem API.
 */
export type AcaoAutomatica = 'retirar' | 'chamar' | 'finalizar' | 'desistir'

interface Peso {
  acao: AcaoAutomatica
  peso: number
}

export function escolherAcao(aguardando: number, emAtendimento: number, sorteio: number): AcaoAutomatica {
  const pesos: Peso[] = [
    // Se a fila já está grande, retirar senha fica menos provável.
    { acao: 'retirar', peso: aguardando >= 12 ? 1 : aguardando === 0 ? 5 : 4 },
  ]
  if (aguardando > 0) pesos.push({ acao: 'chamar', peso: emAtendimento >= 3 ? 1 : 3 })
  // Muita gente em atendimento ao mesmo tempo: favorece finalizar.
  if (emAtendimento > 0) pesos.push({ acao: 'finalizar', peso: emAtendimento >= 3 ? 6 : 3 })
  if (aguardando > 2) pesos.push({ acao: 'desistir', peso: 0.5 })

  const total = pesos.reduce((soma, p) => soma + p.peso, 0)
  let alvo = sorteio * total
  for (const p of pesos) {
    if (alvo < p.peso) return p.acao
    alvo -= p.peso
  }
  return 'retirar'
}
