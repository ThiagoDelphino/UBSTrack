import { apiGet, apiPost } from './api'
import type { AtendimentoResponse, FilaResponse, SenhaResponse, UnidadeResumo } from '../types/fila'

export function listarUnidades(sinal?: AbortSignal): Promise<UnidadeResumo[]> {
  return apiGet<UnidadeResumo[]>('/unidades', sinal)
}

export function buscarFila(idUbs: number, sinal?: AbortSignal): Promise<FilaResponse> {
  return apiGet<FilaResponse>(`/unidades/${idUbs}/fila`, sinal)
}

export function retirarSenha(idUbs: number): Promise<SenhaResponse> {
  return apiPost<SenhaResponse>(`/unidades/${idUbs}/senhas`)
}

export function chamarProximo(idUbs: number): Promise<AtendimentoResponse> {
  return apiPost<AtendimentoResponse>(`/unidades/${idUbs}/chamar-proximo`)
}

export function finalizarAtendimento(idAtendimento: number): Promise<AtendimentoResponse> {
  return apiPost<AtendimentoResponse>(`/atendimentos/${idAtendimento}/finalizar`)
}

export function desistirDaSenha(idAtendimento: number): Promise<AtendimentoResponse> {
  return apiPost<AtendimentoResponse>(`/atendimentos/${idAtendimento}/desistir`)
}
