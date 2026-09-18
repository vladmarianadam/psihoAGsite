import api from './client'
import type { AdminServiceDto, ServiceDetailDto, ServiceInput, ServiceListItemDto } from './types'

export async function getServices(): Promise<ServiceListItemDto[]> {
  const { data } = await api.get<ServiceListItemDto[]>('/api/services')
  return data
}

export async function getServiceBySlug(slug: string): Promise<ServiceDetailDto> {
  const { data } = await api.get<ServiceDetailDto>(`/api/services/${encodeURIComponent(slug)}`)
  return data
}

// ------------------------------------------------------------- management ---

export async function getAdminServices(): Promise<AdminServiceDto[]> {
  const { data } = await api.get<AdminServiceDto[]>('/api/admin/services')
  return data
}

export async function getAdminService(id: number): Promise<AdminServiceDto> {
  const { data } = await api.get<AdminServiceDto>(`/api/admin/services/${id}`)
  return data
}

export async function createService(input: ServiceInput): Promise<void> {
  await api.post('/api/admin/services', input)
}

export async function updateService(id: number, input: ServiceInput): Promise<void> {
  await api.put(`/api/admin/services/${id}`, { ...input, id })
}

export async function deleteService(id: number): Promise<void> {
  await api.delete(`/api/admin/services/${id}`)
}
