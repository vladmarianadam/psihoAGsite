import { useMemo } from 'react'
import { Box } from '@mui/material'
import DOMPurify from 'dompurify'

interface ArticleContentProps {
  html: string
}

/**
 * Whitelist identică cu cea de pe server (`HtmlSanitizerAdapter`). Serverul sanitizează
 * deja la salvare; sanitizarea de aici este a doua barieră, pentru cazul în care conținutul
 * ar ajunge în DOM pe altă cale (import de date, migrare, endpoint compromis).
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'blockquote', 'a', 'img', 'figure', 'figcaption', 'hr',
  'code', 'pre', 'span',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

/**
 * Atributele permise pe server, plus `id`: cuprinsul articolului (`TableOfContents`)
 * adaugă id-uri pe titlurile h2 înainte de randare, iar ancorele nu ar funcționa
 * dacă sanitizarea le-ar elimina.
 */
const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'colspan', 'rowspan',
  'class', 'style',
  'id',
]

/** Doar http, https, mailto, tel și căi relative (`/uploads/...`) — fără `data:` sau `javascript:`. */
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i

function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false

  try {
    return new URL(href, window.location.origin).host !== window.location.host
  } catch {
    return false
  }
}

/**
 * Rulează după filtrarea atributelor, deci ce se adaugă aici rămâne în DOM:
 * linkurile externe se deschid în tab nou fără să expună `window.opener`, iar
 * imaginile din conținut se încarcă leneș.
 */
function hardenLinksAndImages(node: Element): void {
  if (node.nodeName === 'A') {
    const href = node.getAttribute('href')

    if (href && isExternalHref(href)) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  }

  if (node.nodeName === 'IMG') {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('decoding', 'async')
  }
}

export default function ArticleContent({ html }: ArticleContentProps) {
  const safeHtml = useMemo(() => {
    if (!html) return ''

    DOMPurify.addHook('afterSanitizeAttributes', hardenLinksAndImages)

    try {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOWED_URI_REGEXP,
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        // Tagurile nepermise se elimină împreună cu conținutul lor (ca pe server).
        KEEP_CONTENT: false,
      })
    } finally {
      // Instanța DOMPurify este partajată în aplicație — hook-ul nu rămâne activ.
      DOMPurify.removeHook('afterSanitizeAttributes', hardenLinksAndImages)
    }
  }, [html])

  return (
    <Box
      className="article-content"
      sx={{
        // Regulile de bază vin din `.article-content` (src/index.css); aici doar
        // completăm elementele pe care foaia de stil nu le acoperă.
        '& h4': {
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '1.125rem',
          fontWeight: 600,
          margin: '1.5rem 0 0.5rem',
          scrollMarginTop: 96,
        },
        '& figure': { margin: '1.75rem 0' },
        '& figcaption': {
          mt: 1,
          fontSize: '0.875rem',
          color: 'text.secondary',
          textAlign: 'center',
        },
        '& hr': {
          border: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          margin: '2.25rem 0',
        },
        '& code': {
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: '0.9em',
          bgcolor: 'action.hover',
        },
        '& pre': {
          p: 2,
          my: 3,
          borderRadius: 2,
          overflowX: 'auto',
          bgcolor: 'action.hover',
          '& code': { p: 0, bgcolor: 'transparent' },
        },
        // Tabelele lungi nu împing pagina pe orizontală.
        '& table': { display: 'block', overflowX: 'auto' },
      }}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
