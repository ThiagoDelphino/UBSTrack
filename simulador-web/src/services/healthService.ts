import { apiGet } from './api'
import type { StatusApi } from '../types/health'

export function buscarStatusApi(): Promise<StatusApi> {
  return apiGet<StatusApi>('/health')
}
