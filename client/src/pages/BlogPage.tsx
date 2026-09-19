import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Box, Container, InputAdornment, Pagination, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import Seo from '../components/common/Seo'
import ArticleList from '../features/blog/ArticleList'
import CategoryFilter from '../features/blog/CategoryFilter'
import { getPublishedArticles } from '../api/articles'
import { getCategories } from '../api/categories'
import { getErrorMessage } from '../api/client'
import type { ArticleListItemDto, CategoryDto } from '../api/types'

const PAGE_SIZE = 9
const SEARCH_DEBOUNCE_MS = 400

/** Parametrii din URL sunt sursa unică de adevăr; „page” invalid înseamnă pagina 1. */
function parsePage(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

/**
 * Blogul public. Aceeași componentă servește /blog și /blog/categorie/:slug —
 * categoria vine din rută, iar căutarea și pagina din parametrii de query, ca
 * fiecare rezultat să poată fi trimis ca link.
 */
export default function BlogPage() {
  const { slug: categorySlug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = (searchParams.get('q') ?? '').trim()
  const page = parsePage(searchParams.get('page'))

  const [searchInput, setSearchInput] = useState(query)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [articles, setArticles] = useState<ArticleListItemDto[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)

  // Categoriile se încarcă o singură dată; dacă apelul eșuează, filtrul lipsește,
  // dar lista de articole rămâne funcțională.
  useEffect(() => {
    let cancelled = false

    getCategories()
      .then((result) => {
        if (!cancelled) setCategories(result)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Sincronizare inversă: navigare înapoi/înainte sau un link cu ?q= actualizează câmpul.
  useEffect(() => {
    setSearchInput((current) => (current.trim() === query ? current : query))
  }, [query])

  // Căutare cu debounce — scrie în URL, nu în stare locală de filtrare.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === query) return

    const timer = window.setTimeout(() => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (trimmed) {
            next.set('q', trimmed)
          } else {
            next.delete('q')
          }
          // O căutare nouă repornește paginarea.
          next.delete('page')
          return next
        },
        { replace: true },
      )
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput, query, setSearchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getPublishedArticles({
      page,
      pageSize: PAGE_SIZE,
      category: categorySlug,
      q: query || undefined,
    })
      .then((result) => {
        if (cancelled) return
        setArticles(result.items)
        setTotalPages(result.totalPages)
        setTotalCount(result.totalCount)
      })
      .catch((err) => {
        if (cancelled) return
        setArticles([])
        setTotalPages(1)
        setTotalCount(0)
        setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, categorySlug, query])

  const activeCategory = categorySlug
    ? (categories.find((category) => category.slug === categorySlug) ?? null)
    : null
  const categoryName = activeCategory?.name ?? (categorySlug ? (articles[0]?.categoryName ?? null) : null)

  const heading = categoryName ?? 'Articole'
  const subtitle = activeCategory?.description
    ?? (categorySlug
      ? 'Articole din această categorie, scrise pe înțelesul tuturor.'
      : 'Materiale despre anxietate, relații, parenting și echilibru emoțional — explicate calm, fără jargon și fără promisiuni.')

  const seoTitle = query
    ? `Căutare: „${query}”${categoryName ? ` în ${categoryName}` : ''}`
    : (categoryName ?? 'Articole')

  const seoDescription = categoryName
    ? `Articole din categoria ${categoryName} — resurse de psihologie scrise de Adina Gghita.`
    : 'Articole de psihologie despre anxietate, depresie, copii și adolescenți, parenting și dezvoltare personală.'

  // Canonic fără parametri de query; paginile de căutare și cele de la a doua încolo
  // primesc noindex, ca să nu concureze cu /blog și cu articolele în sine.
  const canonicalPath = categorySlug ? `/blog/categorie/${categorySlug}` : '/blog'
  const shouldNoIndex = page > 1 || query.length > 0

  function goToPage(value: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value > 1) {
        next.set('page', String(value))
      } else {
        next.delete('page')
      }
      return next
    })

    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        noIndex={shouldNoIndex}
      />

      <Box component="section" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 3, md: 4 } }}>
        <Container maxWidth="lg">
          <Typography variant="h1" component="h1" sx={{ color: 'text.primary' }}>
            {heading}
          </Typography>
          <Typography variant="subtitle1" component="p" sx={{ mt: 2, maxWidth: '64ch' }}>
            {subtitle}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            type="search"
            label="Caută în articole"
            placeholder="ex. anxietate, somn, comunicare"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            slotProps={{
              // Eticheta rămâne ridicată, altfel s-ar suprapune cu iconița de căutare.
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon aria-hidden="true" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ maxWidth: { sm: 440 } }}
          />

          {categories.length > 0 && (
            <CategoryFilter categories={categories} activeSlug={categorySlug ?? null} />
          )}
        </Box>

        <Box ref={listRef} sx={{ scrollMarginTop: 96, mt: { xs: 4, md: 5 } }}>
          {!loading && !error && totalCount > 0 && (
            <Typography variant="caption" component="p" color="text.secondary" sx={{ mb: 2 }}>
              {totalCount === 1 ? 'Un articol găsit' : `${totalCount} articole găsite`}
              {totalPages > 1 ? ` · pagina ${page} din ${totalPages}` : ''}
            </Typography>
          )}

          <ArticleList
            articles={articles}
            loading={loading}
            error={error}
            emptyMessage={
              query
                ? `Nu am găsit articole pentru „${query}”. Încearcă un termen mai general sau alege o categorie.`
                : categorySlug
                  ? 'În această categorie nu există încă articole publicate. Revino în curând sau explorează celelalte categorii.'
                  : 'Momentan nu există articole publicate. Revino în curând.'
            }
          />

          {!loading && !error && totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 6 } }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_event, value) => goToPage(value)}
                color="primary"
                shape="rounded"
                siblingCount={1}
                getItemAriaLabel={(type, pageNumber) => {
                  switch (type) {
                    case 'previous':
                      return 'Pagina anterioară'
                    case 'next':
                      return 'Pagina următoare'
                    case 'first':
                      return 'Prima pagină'
                    case 'last':
                      return 'Ultima pagină'
                    default:
                      return pageNumber ? `Pagina ${pageNumber}` : 'Mai multe pagini'
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Container>
    </>
  )
}
