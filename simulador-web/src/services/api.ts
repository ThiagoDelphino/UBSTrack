/**
 * Único lugar que sabe o endereço da API e como fazer requisições.
 * Componentes NUNCA chamam fetch direto: eles usam um hook, que usa
 * as funções dos services/.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

export class ApiError extends Error {
  status: number

  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
  }
}

/** A API explica o erro no campo `detail`. Se não vier, usamos uma mensagem genérica. */
async function mensagemDoErro(resposta: Response): Promise<string> {
  try {
    const corpo: unknown = await resposta.json()
    if (typeof corpo === 'object' && corpo !== null && 'detail' in corpo) {
      const { detail } = corpo as { detail: unknown }
      if (typeof detail === 'string') return detail
    }
  } catch {
    // corpo vazio ou que não é JSON: cai na mensagem genérica
  }
  return `A API respondeu com erro ${resposta.status}.`
}

async function requisitar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      // Só declara JSON quando há corpo: um GET "simples" não dispara a checagem prévia do CORS.
      headers: opcoes?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...opcoes,
    })
  } catch {
    // fetch só lança erro quando nem chega na API (fora do ar, sem rede)
    throw new ApiError(0, 'Não foi possível conectar à API.')
  }

  if (!resposta.ok) {
    throw new ApiError(resposta.status, await mensagemDoErro(resposta))
  }
  return (await resposta.json()) as T
}

export function apiGet<T>(caminho: string, sinal?: AbortSignal): Promise<T> {
  return requisitar<T>(caminho, { signal: sinal })
}

export function apiPost<T>(caminho: string, corpo?: unknown): Promise<T> {
  return requisitar<T>(caminho, {
    method: 'POST',
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
}
