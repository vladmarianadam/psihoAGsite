import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { useAuth } from '../hooks/useAuth'

export interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Poarta panoului de management: cât timp încercarea de refresh este în curs nu
 * decidem nimic, ca să nu aruncăm afară un utilizator care are sesiune validă.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress aria-label="Se verifică sesiunea" />
      </Box>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/management/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
