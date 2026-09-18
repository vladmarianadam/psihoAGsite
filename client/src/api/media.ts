import api from './client'
import type { MediaAssetDto, PagedResult } from './types'

export async function getMediaAssets(page = 1, pageSize = 24): Promise<PagedResult<MediaAssetDto>> {
  const { data } = await api.get<PagedResult<MediaAssetDto>>('/api/admin/media', {
    params: { page, pageSize },
  })
  return data
}

/**
 * Încarcă o imagine. Serverul validează tip, magic bytes și dimensiune, apoi
 * redimensionează și convertește în WebP (plan §7).
 */
export async function uploadImage(file: File, altText?: string): Promise<MediaAssetDto> {
  const form = new FormData()
  form.append('file', file)
  if (altText) form.append('altText', altText)

  const { data } = await api.post<MediaAssetDto>('/api/admin/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteMediaAsset(id: number): Promise<void> {
  await api.delete(`/api/admin/media/${id}`)
}
