import api from './client'
import type {
  AppointmentRequestDto,
  AppointmentRequestInput,
  AppointmentTab,
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
  /** Doar pentru programări; ignorat la mesajele de contact. */
  status?: AppointmentTab
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

/** Pending → Confirmed: eveniment în Google Calendar + email cu .ics clientului. */
export async function confirmAppointment(id: number): Promise<void> {
  await api.put(`/api/admin/appointments/${id}/confirm`)
}

/** Pending → Rejected; motivul ajunge în emailul către client. */
export async function rejectAppointment(id: number, reason?: string | null): Promise<void> {
  await api.put(`/api/admin/appointments/${id}/reject`, { reason: reason ?? null })
}

/** Pending/Confirmed → Cancelled; șterge evenimentul din calendar și anunță clientul. */
export async function cancelAppointment(id: number, reason?: string | null): Promise<void> {
  await api.put(`/api/admin/appointments/${id}/cancel`, { reason: reason ?? null })
}

/** Reîncearcă sincronizarea cu Google Calendar (doar pentru GoogleSyncState = Failed). */
export async function resyncAppointment(id: number): Promise<void> {
  await api.post(`/api/admin/appointments/${id}/resync`)
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
