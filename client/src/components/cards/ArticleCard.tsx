import { Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'

import PlaceholderImage from '../common/PlaceholderImage'
import { formatDateRo } from '../common/formatters'
import type { ArticleListItemDto } from '../../api/types'

interface ArticleCardProps {
  article: ArticleListItemDto
  featured?: boolean
}

/** Trunchiere pe un număr fix de rânduri, ca să rămână cardurile aliniate. */
const clampLines = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  }) as const

/** Categoria ca pastilă în gradientul accentelor (contrast AA cu --on-accent în ambele teme). */
const categoryChipSx = {
  background: 'linear-gradient(100deg, var(--accent-1), var(--accent-2))',
  color: 'var(--on-accent)',
  boxShadow: '0 6px 18px -8px var(--c2)',
  '&:hover': { filter: 'brightness(1.08)' },
} as const

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const ratio = featured ? 16 / 9 : 4 / 3
  const dateLabel = formatDateRo(article.publishedAt)

  return (
    <Card sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea
        component={RouterLink}
        to={`/blog/${article.slug}`}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        {article.coverImageUrl ? (
          // Ramă cu overflow ascuns: imaginea se mărește la hover fără să intre peste text.
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <CardMedia
              component="img"
              src={article.coverImageUrl}
              alt={article.coverImageAlt ?? article.title}
              loading="lazy"
              decoding="async"
              sx={{
                width: '100%',
                aspectRatio: String(ratio),
                objectFit: 'cover',
                transition: 'transform .6s cubic-bezier(.2,.8,.2,1)',
                '.MuiCard-root:hover &': { transform: 'scale(1.06)' },
              }}
            />
          </Box>
        ) : (
          <PlaceholderImage
            ratio={ratio}
            label={`Ilustrație pentru articolul „${article.title}”`}
            icon={<ArticleOutlinedIcon />}
          />
        )}

        <CardContent
          sx={{
            flexGrow: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: featured ? { xs: 2.5, md: 3.5 } : 2.5,
          }}
        >
          <Typography
            variant={featured ? 'h3' : 'h4'}
            component="h3"
            sx={{ ...clampLines(2), color: 'text.primary' }}
          >
            {article.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ...clampLines(3), mt: 1.5 }}
          >
            {article.excerpt}
          </Typography>

          <Box
            sx={{
              mt: 'auto',
              pt: 2.5,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              color: 'text.secondary',
            }}
          >
            {dateLabel && (
              <>
                <Typography variant="caption" component="span">
                  {dateLabel}
                </Typography>
                <Box
                  component="span"
                  aria-hidden="true"
                  sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }}
                />
              </>
            )}
            <AccessTimeRoundedIcon aria-hidden="true" sx={{ fontSize: 15 }} />
            <Typography variant="caption" component="span">
              {article.readingMinutes} min de citit
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Chip-ul de categorie stă în afara zonei clicabile, ca să nu apară link în link. */}
      {article.categoryName && (
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
          {article.categorySlug ? (
            <Chip
              component={RouterLink}
              to={`/blog/categorie/${article.categorySlug}`}
              clickable
              size="small"
              label={article.categoryName}
              sx={categoryChipSx}
            />
          ) : (
            <Chip size="small" label={article.categoryName} sx={categoryChipSx} />
          )}
        </Box>
      )}
    </Card>
  )
}
