import { Alert, Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material'

import ArticleCard from '../../components/cards/ArticleCard'
import type { ArticleListItemDto } from '../../api/types'

interface ArticleListProps {
  articles: ArticleListItemDto[]
  loading: boolean
  error?: string | null
  emptyMessage?: string
}

const SKELETON_COUNT = 6
const skeletonSlots = Array.from({ length: SKELETON_COUNT }, (_, index) => index)

/** Card-fantomă cu aceeași structură ca ArticleCard, ca să nu sară layoutul. */
function ArticleCardSkeleton() {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
      <Skeleton variant="rectangular" animation="wave" sx={{ width: '100%', aspectRatio: '4 / 3' }} />
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Skeleton variant="text" animation="wave" sx={{ fontSize: '1.4rem' }} />
        <Skeleton variant="text" animation="wave" width="70%" sx={{ fontSize: '1.4rem' }} />
        <Box sx={{ mt: 1.5 }}>
          <Skeleton variant="text" animation="wave" />
          <Skeleton variant="text" animation="wave" />
          <Skeleton variant="text" animation="wave" width="45%" />
        </Box>
        <Skeleton variant="text" animation="wave" width="55%" sx={{ mt: 2.5 }} />
      </CardContent>
    </Card>
  )
}

/**
 * Grila de articole cu cele trei stări obligatorii: încărcare (schelete),
 * eroare (alertă) și listă goală (mesaj util).
 */
export default function ArticleList({
  articles,
  loading,
  error = null,
  emptyMessage = 'Nu am găsit articole care să corespundă criteriilor alese. Încearcă o altă categorie sau alți termeni de căutare.',
}: ArticleListProps) {
  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    )
  }

  if (loading) {
    return (
      <Grid container spacing={{ xs: 2.5, md: 3 }} aria-busy="true" aria-live="polite">
        {skeletonSlots.map((slot) => (
          <Grid key={slot} size={{ xs: 12, sm: 6, lg: 4 }}>
            <ArticleCardSkeleton />
          </Grid>
        ))}
      </Grid>
    )
  }

  if (articles.length === 0) {
    return (
      <Box
        sx={{
          py: { xs: 5, md: 7 },
          px: 3,
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
          Niciun articol găsit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: '52ch', mx: 'auto' }}>
          {emptyMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={{ xs: 2.5, md: 3 }}>
      {articles.map((article) => (
        <Grid key={article.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <ArticleCard article={article} />
        </Grid>
      ))}
    </Grid>
  )
}
