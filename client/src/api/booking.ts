import api from './client'
import type { BookingInput, BookingSlotsDto, CreatedIdResponse } from './types'

/** Sloturile libere pe zile, între două date locale "yyyy-MM-dd" (maxim 62 de zile). */
export async function getBookingSlots(from: string, to: string, serviceId: number): Promise<BookingSlotsDto> {
  const { data } = await api.get<BookingSlotsDto>('/api/booking/slots', { params: { from, to, serviceId } })
  return data
}

/**
 * Creează o programare Pending pe slotul ales. 409 = slotul tocmai a fost ocupat
 * (sau s-a atins limita de cereri în așteptare pentru acest email).
 */
export async function createBooking(input: BookingInput): Promise<number> {
  const { data } = await api.post<CreatedIdResponse>('/api/booking', input)
  return data.id
}
