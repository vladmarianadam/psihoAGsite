import api from './client'
import type { DashboardStatsDto } from './types'

export async function getDashboardStats(): Promise<DashboardStatsDto> {
  const { data } = await api.get<DashboardStatsDto>('/api/admin/dashboard')
  return data
}
