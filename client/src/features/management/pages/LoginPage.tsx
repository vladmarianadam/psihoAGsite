import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import Seo from '../../../components/common/Seo'
import { getErrorMessage } from '../../../api/client'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Introdu numele de utilizator.'),
  password: z.string().min(1, 'Introdu parola.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

/**
 * Ruta către care ne întoarcem după autentificare. Acceptăm numai căi interne,
 * ca o valoare venită din istoricul navigării să nu devină redirect extern.
 */
function resolveRedirectPath(state: unknown): string {
  const fallback = '/management'
  if (state === null || typeof state !== 'object' || !('from' in state)) return fallback

  const from = (state as { from?: unknown }).from
  let candidate: string | null = null

  if (typeof from === 'string') {
    candidate = from
  } else if (from !== null && typeof from === 'object' && 'pathname' in from) {
    const location = from as { pathname?: unknown; search?: unknown }
    if (typeof location.pathname === 'string') {
      candidate = location.pathname + (typeof location.search === 'string' ? location.search : '')
    }
  }

  if (candidate === null || !candidate.startsWith('/') || candidate.startsWith('//')) return fallback
  if (candidate.startsWith('/management/login')) return fallback

  return candidate
}

export default function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = resolveRedirectPath(location.state)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    try {
      await login(values.username, values.password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // Mesajul rămâne cel generic de la server: nu dezvăluim dacă userul există.
      setServerError(getErrorMessage(error, 'Date de autentificare incorecte.'))
    }
  }

  // Sesiune deja validă (sau tocmai stabilită): nu mai arătăm formularul.
  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        bgcolor: 'background.default',
      }}
    >
      <Seo title="Autentificare" noIndex />

      <Card sx={{ width: '100%', maxWidth: 420, '&:hover': { transform: 'none', boxShadow: 'none' } }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3, alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                color: 'text.secondary',
              }}
            >
              <LockOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="h5" component="h1">
              Autentificare
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Zonă privată. Continuă cu datele tale de acces.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2.5}>
              {serverError !== null && <Alert severity="error">{serverError}</Alert>}

              <TextField
                {...register('username')}
                label="Nume de utilizator"
                autoComplete="username"
                autoFocus
                error={errors.username !== undefined}
                helperText={errors.username?.message}
              />

              <TextField
                {...register('password')}
                label="Parolă"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                error={errors.password !== undefined}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon fontSize="small" />
                          ) : (
                            <VisibilityOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button type="submit" variant="contained" size="large" loading={isSubmitting} fullWidth>
                Intră în cont
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
