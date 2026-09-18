/**
 * Tipurile care circulă între API și client. Sunt derivate 1:1 din DTO-urile C#
 * (`src/PsihoAdinaGghita.Application/Features/**\/Dtos`). Enumurile ajung ca text,
 * pentru că `Program.cs` înregistrează `JsonStringEnumConverter`.
 *
 * Nu redefini aceste tipuri în componente.
 */

export type ArticleStatus = 'Draft' | 'Published'
export type SessionMode = 'Cabinet' | 'Online' | 'Both'

/** Etichete în română pentru afișare. */
export const sessionModeLabels: Record<SessionMode, string> = {
  Cabinet: 'În cabinet',
  Online: 'Online',
  Both: 'În cabinet sau online',
}

export const articleStatusLabels: Record<ArticleStatus, string> = {
  Draft: 'Ciornă',
  Published: 'Publicat',
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

// ---------------------------------------------------------------- Articole ---

export interface ArticleListItemDto {
  id: number
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string | null
  coverImageAlt: string | null
  categoryName: string | null
  categorySlug: string | null
  publishedAt: string | null
  readingMinutes: number
}

export interface ArticleDetailDto {
  id: number
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  coverImageUrl: string | null
  coverImageAlt: string | null
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
  publishedAt: string | null
  updatedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  readingMinutes: number
  viewCount: number
}

export interface AdminArticleListItemDto {
  id: number
  title: string
  slug: string
  categoryName: string | null
  status: ArticleStatus
  publishedAt: string | null
  viewCount: number
  readingMinutes: number
  updatedAt: string | null
  createdAt: string
}

export interface AdminArticleDetailDto {
  id: number
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  coverImageUrl: string | null
  coverImageAlt: string | null
  categoryId: number | null
  status: ArticleStatus
  publishedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  readingMinutes: number
  viewCount: number
  createdAt: string
  updatedAt: string | null
}

/** Corpul cererilor POST/PUT `/api/admin/articles`. */
export interface ArticleInput {
  title: string
  slug?: string | null
  excerpt: string
  contentHtml: string
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  categoryId?: number | null
  metaTitle?: string | null
  metaDescription?: string | null
  publish?: boolean
}

// -------------------------------------------------------------- Categorii ---

export interface CategoryDto {
  id: number
  name: string
  slug: string
  description: string | null
  displayOrder: number
  articleCount: number
}

export interface AdminCategoryDto extends CategoryDto {
  createdAt: string
  updatedAt: string | null
}

export interface CategoryInput {
  name: string
  slug?: string | null
  description?: string | null
  displayOrder: number
}

// --------------------------------------------------------------- Servicii ---

export interface ServiceListItemDto {
  id: number
  name: string
  slug: string
  shortDescription: string
  price: number | null
  priceUnit: string | null
  durationMinutes: number
  iconName: string | null
  imageUrl: string | null
  sessionMode: SessionMode
  displayOrder: number
}

export interface ServiceDetailDto extends ServiceListItemDto {
  longDescriptionHtml: string | null
}

export interface AdminServiceDto extends ServiceDetailDto {
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface ServiceInput {
  name: string
  slug?: string | null
  shortDescription: string
  longDescriptionHtml?: string | null
  price?: number | null
  priceUnit?: string | null
  durationMinutes: number
  iconName?: string | null
  imageUrl?: string | null
  sessionMode: SessionMode
  displayOrder: number
  isActive: boolean
}

// ----------------------------------------------------------- Testimoniale ---

export interface TestimonialDto {
  id: number
  authorName: string
  authorRole: string | null
  text: string
  rating: number
  displayOrder: number
}

export interface AdminTestimonialDto extends TestimonialDto {
  isApproved: boolean
  createdAt: string
  updatedAt: string | null
}

export interface TestimonialInput {
  authorName: string
  authorRole?: string | null
  text: string
  rating: number
  isApproved: boolean
  displayOrder: number
}

// -------------------------------------------------------------------- FAQ ---

export interface FaqItemDto {
  id: number
  question: string
  answerHtml: string
  displayOrder: number
}

export interface AdminFaqItemDto extends FaqItemDto {
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface FaqItemInput {
  question: string
  answerHtml: string
  displayOrder: number
  isActive: boolean
}

// -------------------------------------------------------------- Programări ---

export interface AppointmentRequestDto {
  id: number
  fullName: string
  email: string
  phone: string
  serviceId: number | null
  serviceName: string | null
  preferredMode: SessionMode
  preferredTimeframe: string | null
  message: string | null
  isHandled: boolean
  notes: string | null
  createdAt: string
}

export interface AppointmentRequestInput {
  fullName: string
  email: string
  phone: string
  serviceId?: number | null
  preferredMode: SessionMode
  preferredTimeframe?: string | null
  message?: string | null
  gdprConsent: boolean
  /** Câmp-capcană anti-spam: rămâne mereu gol pentru utilizatorii reali (plan §8). */
  honeypot?: string
}

// ----------------------------------------------------------------- Contact ---

export interface ContactMessageDto {
  id: number
  fullName: string
  email: string
  phone: string | null
  subject: string
  message: string
  isHandled: boolean
  createdAt: string
}

export interface ContactMessageInput {
  fullName: string
  email: string
  phone?: string | null
  subject: string
  message: string
  gdprConsent: boolean
  honeypot?: string
}

// -------------------------------------------------------------------- Auth ---

export interface CurrentUserDto {
  id: number
  username: string
  fullName: string
  mustChangePassword: boolean
  lastLoginAt: string | null
}

export interface AuthResultDto {
  accessToken: string
  expiresAtUtc: string
  user: CurrentUserDto
}

// ------------------------------------------------------------------- Media ---

export interface MediaAssetDto {
  id: number
  fileName: string
  url: string
  contentType: string
  sizeBytes: number
  altText: string | null
  uploadedAt: string
}

// --------------------------------------------------------------- Dashboard ---

export interface DashboardArticleDto {
  id: number
  title: string
  slug: string
  viewCount: number
  status: ArticleStatus
}

export interface DashboardAppointmentDto {
  id: number
  fullName: string
  email: string
  phone: string
  serviceName: string | null
  preferredMode: SessionMode
  isHandled: boolean
  createdAt: string
}

export interface DashboardStatsDto {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  newAppointmentRequests: number
  totalAppointmentRequests: number
  newContactMessages: number
  totalViews: number
  mostViewedArticles: DashboardArticleDto[]
  latestAppointmentRequests: DashboardAppointmentDto[]
}

/** Răspunsul POST-urilor care creează o resursă. */
export interface CreatedIdResponse {
  id: number
}
