import api from './client'
import type {
  AvailabilityDto,
  AvailabilityExceptionInput,
  AvailabilityRuleInput,
  BookingSettingsInput,
  CreatedIdResponse,
} from './types'

export async function getAvailability(): Promise<AvailabilityDto> {
  const { data } = await api.get<AvailabilityDto>('/api/admin/availability')
  return data
}

export async function updateBookingSettings(input: BookingSettingsInput): Promise<void> {
  await api.put('/api/admin/availability/settings', input)
}

/** Înlocuiește tot programul săptămânal. */
export async function replaceAvailabilityRules(rules: AvailabilityRuleInput[]): Promise<void> {
  await api.put('/api/admin/availability/rules', { rules })
}

export async function createAvailabilityException(input: AvailabilityExceptionInput): Promise<number> {
  const { data } = await api.post<CreatedIdResponse>('/api/admin/availability/exceptions', input)
  return data.id
}

export async function deleteAvailabilityException(id: number): Promise<void> {
  await api.delete(`/api/admin/availability/exceptions/${id}`)
}
