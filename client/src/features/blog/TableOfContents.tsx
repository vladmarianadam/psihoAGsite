/* eslint-disable react-refresh/only-export-components --
   `addHeadingIds` trebuie să stea lângă generarea slug-urilor din cuprins: ambele
   folosesc aceeași funcție de numerotare, altfel ancorele nu ar mai coincide. */
import { useMemo } from 'react'
import { Box, Link, Paper, Typography } from '@mui/material'
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded'

interface TableOfContentsProps {
  html: string
  /** Numărul minim de titluri de la care cuprinsul devine util. Implicit 3. */
  minHeadings?: number
}

interface HeadingEntry {
  id: string
  text: string
}

/** Semnele diacritice combinate rămase după descompunerea NFD (ă, â, î, ș, ț). */
const combiningMarks = new RegExp('[\\u0300-\\u036f]', 'g')

/**
 * „Ce se întâmplă în corpul tău” → „ce-se-intampla-in-corpul-tau”.
 * Diacriticele se descompun (NFD) și se elimină semnele combinate, ca id-urile
 * să rămână ASCII și stabile în URL.
 */
function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(combiningMarks, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'sectiune'
}

function parseBody(html: string): HTMLElement | null {
  if (typeof DOMParser === 'undefined') return null

  const parsed = new DOMParser().parseFromString(html, 'text/html')
  return parsed.body
}

/**
 * Sursa unică de adevăr pentru id-uri: parcurge titlurile h2 în ordinea din document
 * și le atribuie câte un id unic. Este folosită atât de cuprins, cât și de
 * `addHeadingIds`, deci ancorele coincid întotdeauna cu id-urile din conținutul randat.
 */
function collectHeadings(body: HTMLElement): { element: Element; entry: HeadingEntry }[] {
  const used = new Map<string, number>()
  const headings: { element: Element; entry: HeadingEntry }[] = []

  for (const element of Array.from(body.querySelectorAll('h2'))) {
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!text) continue

    const existingId = element.getAttribute('id')?.trim()

    if (existingId) {
      headings.push({ element, entry: { id: existingId, text } })
      continue
    }

    const base = slugifyHeading(text)
    const occurrence = (used.get(base) ?? 0) + 1
    used.set(base, occurrence)

    headings.push({
      element,
      entry: { id: occurrence === 1 ? base : `${base}-${occurrence}`, text },
    })
  }

  return headings
}

/**
 * Adaugă `id` pe fiecare titlu h2 din HTML și întoarce HTML-ul rezultat.
 * `ArticlePage` o aplică ÎNAINTE de a trimite conținutul către `ArticleContent`.
 */
export function addHeadingIds(html: string): string {
  if (!html) return html

  const body = parseBody(html)
  if (!body) return html

  const headings = collectHeadings(body)
  if (headings.length === 0) return html

  for (const heading of headings) {
    heading.element.setAttribute('id', heading.entry.id)
  }

  return body.innerHTML
}

export default function TableOfContents({ html, minHeadings = 3 }: TableOfContentsProps) {
  const headings = useMemo<HeadingEntry[]>(() => {
    if (!html) return []

    const body = parseBody(html)
    if (!body) return []

    return collectHeadings(body).map((heading) => heading.entry)
  }, [html])

  if (headings.length < minHeadings) return null

  return (
    <Paper
      component="nav"
      variant="outlined"
      aria-label="Cuprinsul articolului"
      sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, bgcolor: 'background.default' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <ListAltRoundedIcon aria-hidden="true" sx={{ fontSize: 20, color: 'secondary.dark' }} />
        <Typography
          component="p"
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'secondary.dark',
          }}
        >
          Cuprins
        </Typography>
      </Box>

      <Box
        component="ol"
        sx={{
          m: 0,
          pl: 2.75,
          color: 'text.secondary',
          '& li': { mb: 0.75 },
          '& li:last-of-type': { mb: 0 },
        }}
      >
        {headings.map((heading) => (
          <li key={heading.id}>
            <Link
              href={`#${heading.id}`}
              sx={{ color: 'text.primary', fontSize: '0.9375rem', lineHeight: 1.55 }}
            >
              {heading.text}
            </Link>
          </li>
        ))}
      </Box>
    </Paper>
  )
}
