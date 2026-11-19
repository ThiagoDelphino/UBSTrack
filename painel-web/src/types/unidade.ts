// Espelha UnidadeResponse da painel-api (painel-api/app/schemas/unidade.py).
// Se o backend mudar um campo, o TypeScript aponta aqui o que quebrou.
export type Situacao = 'baixa' | 'moderada' | 'alta'

export interface Unidade {
  /** 1º, 2º, 3º… Nulo se a unidade está fechada (ou no detalhe). */
  posicao: number | null
  id: number
  nome: string
  endereco: string | null
  latitude: number
  longitude: number
  /** Nulo se o cidadão não enviou localização. */
  distancia_km: number | null
  /** Aproximado, em linha reta. */
  deslocamento_min: number | null
  /** Senhas aguardando. */
  fila: number
  /** Espera estimada (aprox.), em minutos. */
  espera_min: number
  /** Deslocamento + espera. Nulo sem localização. */
  tempo_total_min: number | null
  situacao: Situacao
  aberta: boolean
  atualizado_em: string | null
  atualizado_ha_min: number | null
  desatualizado: boolean
}

export interface Coordenadas {
  lat: number
  lon: number
}
