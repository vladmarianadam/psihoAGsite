import api from './client'
import type { AdminTestimonialDto, TestimonialDto, TestimonialInput } from './types'

export async function getTestimonials(): Promise<TestimonialDto[]> {
  const { data } = await api.get<TestimonialDto[]>('/api/testimonials')
  return data
}

// ------------------------------------------------------------- management ---

export async function getAdminTestimonials(): Promise<AdminTestimonialDto[]> {
  const { data } = await api.get<AdminTestimonialDto[]>('/api/admin/testimonials')
  return data
}

export async function getAdminTestimonial(id: number): Promise<AdminTestimonialDto> {
  const { data } = await api.get<AdminTestimonialDto>(`/api/admin/testimonials/${id}`)
  return data
}

export async function createTestimonial(input: TestimonialInput): Promise<void> {
  await api.post('/api/admin/testimonials', input)
}

export async function updateTestimonial(id: number, input: TestimonialInput): Promise<void> {
  await api.put(`/api/admin/testimonials/${id}`, { ...input, id })
}

export async function deleteTestimonial(id: number): Promise<void> {
  await api.delete(`/api/admin/testimonials/${id}`)
}

export async function setTestimonialApproved(id: number, isApproved: boolean): Promise<void> {
  await api.post(`/api/admin/testimonials/${id}/approve`, { id, isApproved })
}
