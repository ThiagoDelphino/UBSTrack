/**
 * Único lugar que sabe o endereço da API e como fazer requisições.
 * Componentes NUNCA chamam fetch direto: eles usam um hook, que usa
 * as funções dos services/.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
  }
}

async function requisitar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    })
  } catch {
    // fetch só lança erro quando nem chega na API (fora do ar, sem rede)
    throw new ApiError(0, 'Não foi possível conectar à API.')
  }

  if (!resposta.ok) {
    throw new ApiError(resposta.status, `A API respondeu com erro ${resposta.status}.`)
  }
  return (await resposta.json()) as T
}

export function apiGet<T>(caminho: string): Promise<T> {
  return requisitar<T>(caminho)
}

export function apiPost<T>(caminho: string, corpo?: unknown): Promise<T> {
  return requisitar<T>(caminho, {
    method: 'POST',
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
}
