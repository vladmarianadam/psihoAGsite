import api from './client'
import type { AdminFaqItemDto, FaqItemDto, FaqItemInput } from './types'

export async function getFaq(): Promise<FaqItemDto[]> {
  const { data } = await api.get<FaqItemDto[]>('/api/faq')
  return data
}

// ------------------------------------------------------------- management ---

export async function getAdminFaq(): Promise<AdminFaqItemDto[]> {
  const { data } = await api.get<AdminFaqItemDto[]>('/api/admin/faq')
  return data
}

export async function getAdminFaqItem(id: number): Promise<AdminFaqItemDto> {
  const { data } = await api.get<AdminFaqItemDto>(`/api/admin/faq/${id}`)
  return data
}

export async function createFaqItem(input: FaqItemInput): Promise<void> {
  await api.post('/api/admin/faq', input)
}

export async function updateFaqItem(id: number, input: FaqItemInput): Promise<void> {
  await api.put(`/api/admin/faq/${id}`, { ...input, id })
}

export async function deleteFaqItem(id: number): Promise<void> {
  await api.delete(`/api/admin/faq/${id}`)
}
