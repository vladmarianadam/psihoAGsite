import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

import { site } from '../../config/site'

export interface SeoProps {
  title: string
  description?: string
  /** Cale canonică; implicit ruta curentă. */
  path?: string
  image?: string
  /** `article` pentru paginile de blog, altfel `website`. */
  type?: 'website' | 'article'
  /** Paginile de management primesc noindex, nofollow (plan §7). */
  noIndex?: boolean
  publishedTime?: string | null
  modifiedTime?: string | null
  /** Date structurate schema.org injectate ca application/ld+json. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

/** Titlul complet: „Pagina — Cabinet Psihologic Adina Gghita". */
function buildTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return site.name
  return trimmed === site.name ? site.name : `${trimmed} — ${site.name}`
}

export default function Seo({
  title,
  description = site.description,
  path,
  image,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  jsonLd,
}: SeoProps) {
  const { pathname } = useLocation()
  const canonicalPath = path ?? pathname
  const canonical = `${site.url.replace(/\/+$/, '')}${canonicalPath === '/' ? '' : canonicalPath}`
  const fullTitle = buildTitle(title)
  const absoluteImage = image
    ? image.startsWith('http')
      ? image
      : `${site.url.replace(/\/+$/, '')}${image}`
    : undefined

  const structuredData = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:locale" content="ro_RO" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {absoluteImage && <meta property="og:image" content={absoluteImage} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content={absoluteImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {absoluteImage && <meta name="twitter:image" content={absoluteImage} />}

      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  )
}
