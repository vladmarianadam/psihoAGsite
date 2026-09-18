import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import Seo from '../components/common/Seo'
import CtaBanner from '../components/common/CtaBanner'
import PlaceholderImage from '../components/common/PlaceholderImage'
import ArticleCard from '../components/cards/ArticleCard'
import { formatDateRo } from '../components/common/formatters'
import ArticleContent from '../features/blog/ArticleContent'
import ShareButtons from '../features/blog/ShareButtons'
import TableOfContents, { addHeadingIds } from '../features/blog/TableOfContents'
import { getArticleBySlug, getRelatedArticles } from '../api/articles'
import { getErrorMessage } from '../api/client'
import type { ArticleDetailDto, ArticleListItemDto } from '../api/types'
import { site } from '../config/site'

const siteOrigin = site.url.replace(/\/+$/, '')

function toAbsoluteUrl(value: string | null): string | undefined {
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value

  return `${siteOrigin}${value.startsWith('/') ? '' : '/'}${value}`
}

/** Statusul HTTP al unei erori axios, fără să folosim `any`. */
function getStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined

  const { response } = error as { response?: { status?: number } }
  return response?.status
}

/** Acordul în română: 1 vizualizare, 5 vizualizări, 20 de vizualizări. */
function formatViews(count: number): string {
  if (count === 1) return '1 vizualizare'

  const remainder = count % 100
  const needsDe = count >= 20 && (remainder === 0 || remainder >= 20)

  return `${count} ${needsDe ? 'de ' : ''}vizualizări`
}

interface MetaItemProps {
  icon: ReactNode
  label: string
}

function MetaItem({ icon, label }: MetaItemProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
      <Box component="span" aria-hidden="true" sx={{ display: 'flex', '& svg': { fontSize: 17 } }}>
        {icon}
      </Box>
      <Typography variant="body2" component="span">
        {label}
      </Typography>
    </Box>
  )
}

/** Schelet care imită structura articolului: titlu, meta, copertă, cuprins, text. */
function ArticleSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="45%" height={22} />

      <Skeleton variant="rounded" width={140} height={26} sx={{ mt: 3 }} />
      <Skeleton variant="text" width="95%" height={54} sx={{ mt: 2 }} />
      <Skeleton variant="text" width="70%" height={54} />

      <Stack direction="row" spacing={3} sx={{ mt: 2, mb: 4 }}>
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="text" width={90} height={20} />
      </Stack>

      <Skeleton variant="rounded" sx={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 2 }} />

      <Skeleton variant="rounded" height={150} sx={{ mt: 5, borderRadius: 2 }} />

      <Box sx={{ mt: 5 }}>
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            height={24}
            width={index % 4 === 3 ? '72%' : '100%'}
          />
        ))}
      </Box>
    </Box>
  )
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()

  const [article, setArticle] = useState<ArticleDetailDto | null>(null)
  const [related, setRelated] = useState<ArticleListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setNotFound(true)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)
    setNotFound(false)
    setArticle(null)
    setRelated([])

    // Cele două cereri pleacă în paralel; articolele similare sunt opționale,
    // așa că o eroare de acolo nu afectează pagina.
    Promise.allSettled([getArticleBySlug(slug), getRelatedArticles(slug, 3)])
      .then(([detailResult, relatedResult]) => {
        if (cancelled) return

        if (detailResult.status === 'fulfilled') {
          setArticle(detailResult.value)
        } else if (getStatusCode(detailResult.reason) === 404) {
          setNotFound(true)
        } else {
          setError(getErrorMessage(detailResult.reason))
        }

        if (relatedResult.status === 'fulfilled') {
          setRelated(relatedResult.value)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  // Id-urile pe titluri se adaugă o singură dată, înainte de randare: cuprinsul și
  // conținutul primesc exact același HTML, deci ancorele coincid.
  const contentHtml = useMemo(
    () => (article ? addHeadingIds(article.contentHtml) : ''),
    [article],
  )

  const jsonLd = useMemo<Record<string, unknown>[] | undefined>(() => {
    if (!article) return undefined

    const pageUrl = `${siteOrigin}/blog/${article.slug}`
    const organization = { '@type': 'Organization', name: site.name, url: siteOrigin }
    const coverImage = toAbsoluteUrl(article.coverImageUrl)

    const articleLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription ?? article.excerpt,
      inLanguage: 'ro-RO',
      author: organization,
      publisher: organization,
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      url: pageUrl,
    }

    if (article.publishedAt) articleLd.datePublished = article.publishedAt
    if (article.updatedAt ?? article.publishedAt) {
      articleLd.dateModified = article.updatedAt ?? article.publishedAt
    }
    if (coverImage) articleLd.image = coverImage

    const breadcrumbItems: Record<string, unknown>[] = [
      { '@type': 'ListItem', position: 1, name: 'Acasă', item: `${siteOrigin}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteOrigin}/blog` },
    ]

    if (article.categoryName && article.categorySlug) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: article.categoryName,
        item: `${siteOrigin}/blog/categorie/${article.categorySlug}`,
      })
    }

    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: article.title,
      item: pageUrl,
    })

    return [
      articleLd,
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
    ]
  }, [article])

  // ------------------------------------------------------------- încărcare ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <ArticleSkeleton />
      </Container>
    )
  }

  // ------------------------------------------------------------------- 404 ---
  if (notFound || (!article && !error)) {
    return (
      <>
        <Seo title="Articolul nu a fost găsit" noIndex />

        <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Articolul nu a fost găsit
          </Typography>

          <Typography variant="subtitle1" component="p" sx={{ mt: 2, mx: 'auto' }}>
            Este posibil ca adresa să fie greșită sau ca articolul să nu mai fie publicat.
            Îl poți căuta în lista completă de articole.
          </Typography>

          <Button
            component={RouterLink}
            to="/blog"
            variant="contained"
            size="large"
            sx={{ mt: 4 }}
          >
            Vezi toate articolele
          </Button>
        </Container>
      </>
    )
  }

  // ----------------------------------------------------------------- eroare ---
  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
        <Alert severity="error">{error}</Alert>

        <Button component={RouterLink} to="/blog" variant="outlined" sx={{ mt: 3 }}>
          Înapoi la blog
        </Button>
      </Container>
    )
  }

  const publishedLabel = formatDateRo(article.publishedAt)
  const shareUrl = `${siteOrigin}/blog/${article.slug}`

  return (
    <>
      <Seo
        title={article.metaTitle ?? article.title}
        description={article.metaDescription ?? article.excerpt}
        path={`/blog/${article.slug}`}
        image={article.coverImageUrl ?? undefined}
        type="article"
        publishedTime={article.publishedAt}
        modifiedTime={article.updatedAt ?? article.publishedAt}
        jsonLd={jsonLd}
      />

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon fontSize="small" />}
          aria-label="Traseu de navigare"
          sx={{ fontSize: '0.875rem' }}
        >
          <Link component={RouterLink} to="/" color="text.secondary">
            Acasă
          </Link>
          <Link component={RouterLink} to="/blog" color="text.secondary">
            Blog
          </Link>
          {article.categoryName && article.categorySlug && (
            <Link
              component={RouterLink}
              to={`/blog/categorie/${article.categorySlug}`}
              color="text.secondary"
            >
              {article.categoryName}
            </Link>
          )}
          <Typography variant="body2" component="span" sx={{ color: 'text.primary' }}>
            {article.title}
          </Typography>
        </Breadcrumbs>

        <Box component="header" sx={{ mt: { xs: 3, md: 4 } }}>
          {article.categoryName && (
            <Box sx={{ mb: 2 }}>
              {article.categorySlug ? (
                <Chip
                  component={RouterLink}
                  to={`/blog/categorie/${article.categorySlug}`}
                  clickable
                  label={article.categoryName}
                  size="small"
                  color="secondary"
                />
              ) : (
                <Chip label={article.categoryName} size="small" color="secondary" />
              )}
            </Box>
          )}

          <Typography variant="h1" sx={{ fontSize: { xs: '2.125rem', md: '3rem' } }}>
            {article.title}
          </Typography>

          <Stack
            direction="row"
            spacing={2.5}
            useFlexGap
            sx={{ mt: 2.5, flexWrap: 'wrap', alignItems: 'center' }}
          >
            {publishedLabel && (
              <MetaItem icon={<CalendarTodayRoundedIcon />} label={publishedLabel} />
            )}
            <MetaItem
              icon={<AccessTimeRoundedIcon />}
              label={`${article.readingMinutes} min de citit`}
            />
            {article.viewCount > 0 && (
              <MetaItem icon={<VisibilityOutlinedIcon />} label={formatViews(article.viewCount)} />
            )}
          </Stack>

          <Typography variant="subtitle1" component="p" sx={{ mt: 3 }}>
            {article.excerpt}
          </Typography>
        </Box>

        <Box sx={{ mt: { xs: 4, md: 5 } }}>
          {article.coverImageUrl ? (
            <Box
              component="img"
              src={article.coverImageUrl}
              alt={article.coverImageAlt ?? article.title}
              decoding="async"
              sx={{
                width: '100%',
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                borderRadius: 2,
                display: 'block',
              }}
            />
          ) : (
            <PlaceholderImage
              ratio={16 / 9}
              rounded={2}
              label={`Ilustrație pentru articolul „${article.title}”`}
              icon={<ArticleOutlinedIcon />}
            />
          )}
        </Box>

        <Box sx={{ mt: { xs: 4, md: 5 } }}>
          <TableOfContents html={contentHtml} />
        </Box>

        <Box sx={{ mt: { xs: 4, md: 5 } }}>
          <ArticleContent html={contentHtml} />
        </Box>

        <Divider sx={{ my: { xs: 4, md: 6 } }} />

        <ShareButtons title={article.title} url={shareUrl} />

        <Box sx={{ mt: { xs: 6, md: 8 } }}>
          <CtaBanner />
        </Box>
      </Container>

      {related.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
            <Typography variant="h2" component="h2" sx={{ mb: { xs: 3, md: 4 } }}>
              Articole similare
            </Typography>

            <Grid container spacing={3}>
              {related.map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ArticleCard article={item} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}
    </>
  )
}
