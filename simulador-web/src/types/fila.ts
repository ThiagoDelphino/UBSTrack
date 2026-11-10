// Espelha os schemas da simulador-api (simulador-api/app/schemas/).
export type StatusSenha = 'aguardando' | 'em_atendimento' | 'finalizado' | 'desistiu'

export interface UnidadeResumo {
  id: number
  nome: string
  endereco: string | null
}

/** Resposta de "retirar senha". */
export interface SenhaResponse {
  id_atendimento: number
  id_ubs: number
  codigo_senha: string
  status: StatusSenha
  entrada: string
}

export interface SenhaNaFila {
  id_atendimento: number
  codigo_senha: string
  status: StatusSenha
  entrada: string
  inicio_atendimento: string | null
}

export interface FilaResponse {
  id_ubs: number
  nome: string
  aguardando: number
  em_atendimento: number
  /** Da mais antiga para a mais nova. */
  senhas_aguardando: SenhaNaFila[]
  senhas_em_atendimento: SenhaNaFila[]
}

/** Resposta de chamar, finalizar e desistir. */
export interface AtendimentoResponse {
  id_atendimento: number
  id_ubs: number
  id_servico: number
  codigo_senha: string
  status: StatusSenha
  entrada: string
  inicio_atendimento: string | null
  fim_atendimento: string | null
}
