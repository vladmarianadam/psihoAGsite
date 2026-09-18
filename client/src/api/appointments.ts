import api from './client'
import type {
  AppointmentRequestDto,
  AppointmentRequestInput,
  ContactMessageDto,
  ContactMessageInput,
  CreatedIdResponse,
  PagedResult,
} from './types'

/** Formularul public de cerere de programare (rate-limited pe server). */
export async function createAppointmentRequest(input: AppointmentRequestInput): Promise<number> {
  const { data } = await api.post<CreatedIdResponse>('/api/appointments', input)
  return data.id
}

/** Formularul public de contact. */
export async function createContactMessage(input: ContactMessageInput): Promise<number> {
  const { data } = await api.post<CreatedIdResponse>('/api/contact', input)
  return data.id
}

// ------------------------------------------------------------- management ---

export interface AppointmentsParams {
  page?: number
  pageSize?: number
  isHandled?: boolean
}

export async function getAppointmentRequests(
  params: AppointmentsParams = {},
): Promise<PagedResult<AppointmentRequestDto>> {
  const { data } = await api.get<PagedResult<AppointmentRequestDto>>('/api/admin/appointments', { params })
  return data
}

export async function markAppointmentHandled(
  id: number,
  isHandled: boolean,
  notes?: string | null,
): Promise<void> {
  await api.put(`/api/admin/appointments/${id}/handled`, { id, isHandled, notes: notes ?? null })
}

export async function deleteAppointmentRequest(id: number): Promise<void> {
  await api.delete(`/api/admin/appointments/${id}`)
}

export async function getContactMessages(
  params: AppointmentsParams = {},
): Promise<PagedResult<ContactMessageDto>> {
  const { data } = await api.get<PagedResult<ContactMessageDto>>('/api/admin/contact-messages', { params })
  return data
}

export async function markContactMessageHandled(id: number, isHandled: boolean): Promise<void> {
  await api.put(`/api/admin/contact-messages/${id}/handled`, { id, isHandled })
}

export async function deleteContactMessage(id: number): Promise<void> {
  await api.delete(`/api/admin/contact-messages/${id}`)
}
