import api from './client'
import type {
  AdminArticleDetailDto,
  AdminArticleListItemDto,
  ArticleDetailDto,
  ArticleInput,
  ArticleListItemDto,
  ArticleStatus,
  CreatedIdResponse,
  PagedResult,
} from './types'

export interface PublishedArticlesParams {
  page?: number
  pageSize?: number
  category?: string
  q?: string
}

export async function getPublishedArticles(
  params: PublishedArticlesParams = {},
): Promise<PagedResult<ArticleListItemDto>> {
  const { data } = await api.get<PagedResult<ArticleListItemDto>>('/api/articles', { params })
  return data
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetailDto> {
  const { data } = await api.get<ArticleDetailDto>(`/api/articles/${encodeURIComponent(slug)}`)
  return data
}

export async function getRelatedArticles(slug: string, count = 3): Promise<ArticleListItemDto[]> {
  const { data } = await api.get<ArticleListItemDto[]>(
    `/api/articles/${encodeURIComponent(slug)}/related`,
    { params: { count } },
  )
  return data
}

// ------------------------------------------------------------- management ---

export interface AdminArticlesParams {
  page?: number
  pageSize?: number
  status?: ArticleStatus
  q?: string
}

export async function getAdminArticles(
  params: AdminArticlesParams = {},
): Promise<PagedResult<AdminArticleListItemDto>> {
  const { data } = await api.get<PagedResult<AdminArticleListItemDto>>('/api/admin/articles', { params })
  return data
}

export async function getAdminArticle(id: number): Promise<AdminArticleDetailDto> {
  const { data } = await api.get<AdminArticleDetailDto>(`/api/admin/articles/${id}`)
  return data
}

export async function createArticle(input: ArticleInput): Promise<number> {
  const { data } = await api.post<CreatedIdResponse>('/api/admin/articles', input)
  return data.id
}

export async function updateArticle(id: number, input: ArticleInput): Promise<void> {
  await api.put(`/api/admin/articles/${id}`, { ...input, id })
}

export async function deleteArticle(id: number): Promise<void> {
  await api.delete(`/api/admin/articles/${id}`)
}

export async function setArticlePublished(id: number, publish: boolean): Promise<void> {
  await api.post(`/api/admin/articles/${id}/publish`, { publish })
}
