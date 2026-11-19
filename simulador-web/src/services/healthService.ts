import { apiGet } from './api'
import type { StatusApi } from '../types/health'

export function buscarStatusApi(sinal?: AbortSignal): Promise<StatusApi> {
  return apiGet<StatusApi>('/health', sinal)
}
