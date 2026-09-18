import type { ReactNode } from 'react'
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'

import Seo from '../../../components/common/Seo'

export interface CrudPageShellProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  loading: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  children: ReactNode
}

const SKELETON_ROWS = [0, 1, 2, 3]

/**
 * Carcasa comună a paginilor de management: titlu, descriere, acțiune principală
 * și cele trei stări obligatorii (încărcare / eroare / listă goală).
 * Titlul rămâne singurul `<h1>` al paginii, dar la dimensiunea potrivită panoului.
 */
export default function CrudPageShell({
  title,
  description,
  actionLabel,
  onAction,
  loading,
  error,
  empty = false,
  emptyMessage,
  children,
}: CrudPageShellProps) {
  let content: ReactNode

  if (loading) {
    content = (
      <Stack spacing={1.5} aria-busy="true">
        <Skeleton variant="rounded" height={44} />
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} variant="rounded" height={64} />
        ))}
      </Stack>
    )
  } else if (error) {
    // Eroarea de încărcare este deja afișată mai sus; nu mai arătăm conținut parțial.
    content = null
  } else if (empty) {
    content = (
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {emptyMessage ?? 'Nu există încă înregistrări. Adaugă prima folosind butonul de mai sus.'}
        </Typography>
      </Paper>
    )
  } else {
    content = children
  }

  return (
    <Box>
      <Seo title={title} noIndex />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {description !== undefined && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
              {description}
            </Typography>
          )}
        </Box>

        {actionLabel !== undefined && onAction !== undefined && (
          <Button
            variant="contained"
            onClick={onAction}
            sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {content}
    </Box>
  )
}
