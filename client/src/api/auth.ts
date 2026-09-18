import api from './client'
import type { AuthResultDto, CurrentUserDto } from './types'

/**
 * Refresh tokenul nu apare niciodată în răspuns — el circulă exclusiv prin
 * cookie-ul HttpOnly `psiho_refresh` (plan §7).
 */
export async function login(username: string, password: string): Promise<AuthResultDto> {
  const { data } = await api.post<AuthResultDto>('/api/auth/login', { username, password })
  return data
}

export async function refresh(): Promise<AuthResultDto> {
  const { data } = await api.post<AuthResultDto>('/api/auth/refresh', {})
  return data
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout', {})
}

export async function getCurrentUser(): Promise<CurrentUserDto> {
  const { data } = await api.get<CurrentUserDto>('/api/auth/me')
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/api/auth/change-password', { currentPassword, newPassword })
}
