import api from './client'
import type { AdminCategoryDto, CategoryDto, CategoryInput } from './types'

export async function getCategories(): Promise<CategoryDto[]> {
  const { data } = await api.get<CategoryDto[]>('/api/categories')
  return data
}

// ------------------------------------------------------------- management ---

export async function getAdminCategories(): Promise<AdminCategoryDto[]> {
  const { data } = await api.get<AdminCategoryDto[]>('/api/admin/categories')
  return data
}

export async function getAdminCategory(id: number): Promise<AdminCategoryDto> {
  const { data } = await api.get<AdminCategoryDto>(`/api/admin/categories/${id}`)
  return data
}

export async function createCategory(input: CategoryInput): Promise<void> {
  await api.post('/api/admin/categories', input)
}

export async function updateCategory(id: number, input: CategoryInput): Promise<void> {
  await api.put(`/api/admin/categories/${id}`, { ...input, id })
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/admin/categories/${id}`)
}
