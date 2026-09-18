import { useCallback, useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'

import Seo from '../../../components/common/Seo'
import { getErrorMessage } from '../../../api/client'
import {
  createArticle,
  getAdminArticle,
  setArticlePublished,
  updateArticle,
} from '../../../api/articles'
import type { AdminArticleDetailDto, ArticleInput } from '../../../api/types'
import ArticleForm from '../components/ArticleForm'
import type { ArticleAutoSaveTrigger } from '../components/ArticleForm'

const AUTOSAVE_INTERVAL_MS = 30_000

const timeFormatter = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })

interface LoadedArticle {
  id: number
  article: AdminArticleDetailDto
}

interface LoadFailure {
  id: number
  message: string
}

export default function ArticleEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const hasInvalidId = id !== undefined && !/^\d+$/.test(id)
  const routeId = id !== undefined && !hasInvalidId ? Number(id) : null

  const [loaded, setLoaded] = useState<LoadedArticle | null>(null)
  const [failure, setFailure] = useState<LoadFailure | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)

  /** Ținta salvărilor: `null` până la prima creare, apoi id-ul articolului. */
  const currentIdRef = useRef<number | null>(routeId)
  const savingRef = useRef(false)
  const dirtyRef = useRef(false)
  const autoSaveRunningRef = useRef(false)
  const autoSaveRef = useRef<ArticleAutoSaveTrigger | null>(null)

  // Stările de afișare se deduc din date, ca să nu fie nevoie de setState în efect.
  const article = loaded !== null && loaded.id === routeId ? loaded.article : null
  const loadError = hasInvalidId
    ? 'Adresa articolului nu este validă.'
    : failure !== null && failure.id === routeId
      ? failure.message
      : null
  const loading = routeId !== null && article === null && loadError === null

  useEffect(() => {
    currentIdRef.current = routeId
  }, [routeId])

  // ------------------------------------------------------------- încărcare ---
  useEffect(() => {
    if (routeId === null) return
    // Articolul deja încărcat (inclusiv cel tocmai creat) nu se mai cere din nou.
    if (loaded !== null && loaded.id === routeId) return
    if (failure !== null && failure.id === routeId) return

    let cancelled = false

    getAdminArticle(routeId)
      .then((result) => {
        if (!cancelled) setLoaded({ id: result.id, article: result })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailure({
            id: routeId,
            message: getErrorMessage(error, 'Articolul nu a putut fi încărcat.'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [routeId, loaded, failure])

  // --------------------------------------------------------------- salvare ---
  const handleSubmit = useCallback(
    async (input: ArticleInput, publish: boolean) => {
      setSaving(true)
      savingRef.current = true
      setSaveError(null)

      try {
        const currentId = currentIdRef.current

        if (currentId === null) {
          const newId = await createArticle({ ...input, publish })
          currentIdRef.current = newId

          const fresh = await getAdminArticle(newId)
          setLoaded({ id: newId, article: fresh })
          setAutoSavedAt(null)
          // Replace, ca butonul „înapoi” să nu întoarcă la formularul de articol nou.
          navigate(`/management/articole/${newId}`, { replace: true })
          setNotice(publish ? 'Articolul a fost publicat.' : 'Ciorna a fost salvată.')
          return
        }

        const wasPublished = article?.status === 'Published'
        await updateArticle(currentId, { ...input, publish })

        // Schimbarea stării trece explicit prin endpoint-ul dedicat publicării.
        if (publish !== wasPublished) {
          await setArticlePublished(currentId, publish)
        }

        const fresh = await getAdminArticle(currentId)
        setLoaded({ id: currentId, article: fresh })
        setAutoSavedAt(null)

        if (publish && !wasPublished) setNotice('Articolul a fost publicat.')
        else if (!publish && wasPublished) setNotice('Articolul a fost retras din publicare.')
        else setNotice('Modificările au fost salvate.')
      } catch (error) {
        setSaveError(getErrorMessage(error, 'Articolul nu a putut fi salvat.'))
        // Aruncăm mai departe, ca formularul să nu marcheze datele drept salvate.
        throw error
      } finally {
        savingRef.current = false
        setSaving(false)
      }
    },
    [article, navigate],
  )

  const handleDirtyChange = useCallback((value: boolean) => {
    dirtyRef.current = value
    setDirty(value)
  }, [])

  // ----------------------------------------------------------- autosalvare ---
  // Doar ciornele deja existente se salvează singure; publicarea nu se atinge niciodată.
  useEffect(() => {
    if (article === null || article.status !== 'Draft') return

    const intervalId = window.setInterval(() => {
      if (savingRef.current || autoSaveRunningRef.current || !dirtyRef.current) return

      const trigger = autoSaveRef.current
      if (trigger === null) return

      autoSaveRunningRef.current = true
      trigger()
        .then((saved) => {
          if (saved) setAutoSavedAt(new Date())
        })
        .catch(() => {
          // Eroarea este deja afișată de fluxul de salvare.
        })
        .finally(() => {
          autoSaveRunningRef.current = false
        })
    }, AUTOSAVE_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [article])

  // ------------------------------------- avertisment la părăsirea paginii ---
  useEffect(() => {
    if (!dirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  const heading = routeId === null ? 'Articol nou' : 'Editare articol'

  return (
    <Box>
      <Seo title="Editor articol" noIndex />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Button
            component={RouterLink}
            to="/management/articole"
            startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
            color="inherit"
            size="small"
            sx={{ ml: -1.5, mb: 0.5, color: 'text.secondary' }}
          >
            Toate articolele
          </Button>
          <Typography variant="h4" component="h1">
            {heading}
          </Typography>
        </Box>

        <Stack spacing={0.5} sx={{ alignItems: { sm: 'flex-end' } }}>
          {autoSavedAt !== null && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CheckCircleOutlineOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                Salvat automat la {timeFormatter.format(autoSavedAt)}
              </Typography>
            </Stack>
          )}

          {article !== null && article.status === 'Published' && (
            <Link
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noopener"
              variant="body2"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              Vezi articolul publicat
              <OpenInNewOutlinedIcon sx={{ fontSize: '1rem' }} />
            </Link>
          )}
        </Stack>
      </Stack>

      {loadError !== null && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            hasInvalidId ? (
              <Button component={RouterLink} to="/management/articole" color="inherit" size="small">
                Înapoi la listă
              </Button>
            ) : (
              <Button color="inherit" size="small" onClick={() => setFailure(null)}>
                Reîncearcă
              </Button>
            )
          }
        >
          {loadError}
        </Alert>
      )}

      {saveError !== null && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {loading && (
        <Card sx={{ '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="45%" height={44} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {!loading && loadError === null && (
        <ArticleForm
          key={article?.id ?? 'nou'}
          initial={article ?? undefined}
          onSubmit={handleSubmit}
          saving={saving}
          onDirtyChange={handleDirtyChange}
          autoSaveRef={autoSaveRef}
        />
      )}

      <Snackbar
        open={notice !== null}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        message={notice ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
