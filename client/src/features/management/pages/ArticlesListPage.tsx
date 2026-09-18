import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined'

import Seo from '../../../components/common/Seo'
import { getErrorMessage } from '../../../api/client'
import { deleteArticle, getAdminArticles, setArticlePublished } from '../../../api/articles'
import { articleStatusLabels } from '../../../api/types'
import type { AdminArticleListItemDto, ArticleStatus, PagedResult } from '../../../api/types'
import { formatDateRo, formatDateTimeRo } from '../../../components/common/formatters'

type StatusFilter = 'all' | ArticleStatus

const SEARCH_DEBOUNCE_MS = 400

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Toate' },
  { value: 'Published', label: 'Publicate' },
  { value: 'Draft', label: 'Ciorne' },
]

/** Rezultatul păstrează cheia cererii care l-a produs: `key !== requestKey` ⇒ se încarcă. */
interface ListState {
  key: string
  result: PagedResult<AdminArticleListItemDto> | null
  error: string | null
}

export default function ArticlesListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [state, setState] = useState<ListState>({ key: '', result: null, error: null })
  const [reloadToken, setReloadToken] = useState(0)

  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<AdminArticleListItemDto | null>(null)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)

  // Căutarea pleacă spre API doar după ce utilizatorul se oprește din scris.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const requestKey = `${statusFilter}|${search}|${page}|${pageSize}|${reloadToken}`

  useEffect(() => {
    let cancelled = false

    getAdminArticles({
      page: page + 1,
      pageSize,
      status: statusFilter === 'all' ? undefined : statusFilter,
      q: search === '' ? undefined : search,
    })
      .then((response) => {
        if (!cancelled) setState({ key: requestKey, result: response, error: null })
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setState({
            key: requestKey,
            result: null,
            error: getErrorMessage(fetchError, 'Lista de articole nu a putut fi încărcată.'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [requestKey, page, pageSize, statusFilter, search])

  const loading = state.key !== requestKey
  const result = state.result
  const error = state.key === requestKey ? state.error : null

  const reload = () => setReloadToken((token) => token + 1)

  const handleTogglePublished = async (item: AdminArticleListItemDto) => {
    const publish = item.status !== 'Published'
    setBusyId(item.id)
    setActionError(null)

    try {
      await setArticlePublished(item.id, publish)
      setNotice(publish ? 'Articolul a fost publicat.' : 'Articolul a fost retras din publicare.')
      reload()
    } catch (toggleError) {
      setActionError(getErrorMessage(toggleError, 'Starea articolului nu a putut fi schimbată.'))
    } finally {
      setBusyId(null)
    }
  }

  const closeDeleteDialog = () => {
    setPendingDelete(null)
    setDeleteConfirmed(false)
  }

  const handleDelete = async () => {
    if (pendingDelete === null) return

    const target = pendingDelete
    setBusyId(target.id)
    setActionError(null)

    try {
      await deleteArticle(target.id)
      closeDeleteDialog()
      setNotice(`Articolul „${target.title}” a fost șters.`)
      // Dacă am șters ultimul articol din pagină, ne întoarcem cu o pagină.
      if (result !== null && result.items.length === 1 && page > 0) setPage((current) => current - 1)
      else reload()
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError, 'Articolul nu a putut fi șters.'))
    } finally {
      setBusyId(null)
    }
  }

  const items = result?.items ?? []
  const isFiltered = statusFilter !== 'all' || search !== ''

  return (
    <Box>
      <Seo title="Articole" noIndex />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Articole
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scrie, publică și actualizează articolele din blog.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to="/management/articole/nou"
          variant="contained"
          startIcon={<AddOutlinedIcon fontSize="small" />}
          sx={{ flexShrink: 0 }}
        >
          Articol nou
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2.5, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          size="small"
          onChange={(_event, value: StatusFilter | null) => {
            if (value !== null) {
              setStatusFilter(value)
              setPage(0)
            }
          }}
          aria-label="Filtrează după stare"
        >
          {statusFilterOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value} sx={{ px: 2 }}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Caută după titlu sau rezumat"
          size="small"
          label="Căutare"
          sx={{ maxWidth: { md: 340 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {actionError !== null && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {error !== null ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Reîncearcă
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <Card sx={{ '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Titlu</TableCell>
                  <TableCell>Categorie</TableCell>
                  <TableCell>Stare</TableCell>
                  <TableCell align="right">Vizualizări</TableCell>
                  <TableCell>Publicat</TableCell>
                  <TableCell>Ultima modificare</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell colSpan={7}>
                        <Skeleton variant="text" height={32} />
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Stack spacing={1.5} sx={{ alignItems: 'center', py: 6, textAlign: 'center' }}>
                        <ArticleOutlinedIcon color="disabled" />
                        <Typography variant="subtitle1" component="p" sx={{ color: 'text.primary' }}>
                          {isFiltered
                            ? 'Niciun articol nu corespunde filtrelor alese.'
                            : 'Încă nu există articole.'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isFiltered
                            ? 'Încearcă alt termen de căutare sau schimbă filtrul de stare.'
                            : 'Primul articol poate porni de la o întrebare pe care o auzi des în cabinet.'}
                        </Typography>
                        {!isFiltered && (
                          <Button
                            component={RouterLink}
                            to="/management/articole/nou"
                            variant="contained"
                            startIcon={<AddOutlinedIcon fontSize="small" />}
                          >
                            Scrie primul articol
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  items.map((item) => {
                    const isPublished = item.status === 'Published'
                    const isBusy = busyId === item.id

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Link
                            component={RouterLink}
                            to={`/management/articole/${item.id}`}
                            sx={{ fontWeight: 600 }}
                          >
                            {item.title}
                          </Link>
                          <Typography variant="caption" color="text.secondary" display="block">
                            /blog/{item.slug} · {item.readingMinutes} min
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {item.categoryName ?? (
                            <Typography variant="body2" color="text.disabled">
                              Fără categorie
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={articleStatusLabels[item.status]}
                            size="small"
                            color={isPublished ? 'success' : 'default'}
                            variant={isPublished ? 'filled' : 'outlined'}
                          />
                        </TableCell>

                        <TableCell align="right">{item.viewCount}</TableCell>

                        <TableCell>
                          {item.publishedAt !== null ? (
                            formatDateRo(item.publishedAt)
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTimeRo(item.updatedAt ?? item.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Editează">
                              <IconButton
                                component={RouterLink}
                                to={`/management/articole/${item.id}`}
                                size="small"
                                aria-label={`Editează articolul ${item.title}`}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={isPublished ? 'Retrage din publicare' : 'Publică'}>
                              <IconButton
                                onClick={() => void handleTogglePublished(item)}
                                disabled={isBusy}
                                size="small"
                                aria-label={
                                  isPublished
                                    ? `Retrage din publicare articolul ${item.title}`
                                    : `Publică articolul ${item.title}`
                                }
                              >
                                {isPublished ? (
                                  <UnpublishedOutlinedIcon fontSize="small" />
                                ) : (
                                  <PublishOutlinedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Șterge">
                              <IconButton
                                onClick={() => {
                                  setDeleteConfirmed(false)
                                  setPendingDelete(item)
                                }}
                                disabled={isBusy}
                                size="small"
                                color="error"
                                aria-label={`Șterge articolul ${item.title}`}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={result?.totalCount ?? 0}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Articole pe pagină"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} din ${count}`}
            getItemAriaLabel={(type) => (type === 'previous' ? 'Pagina anterioară' : 'Pagina următoare')}
          />
        </Card>
      )}

      {/* ---------------------------- Confirmare ștergere ---------------------------- */}
      <Dialog open={pendingDelete !== null} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Ștergi articolul?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Articolul <strong>{pendingDelete?.title}</strong> va fi șters definitiv, împreună cu
            adresa lui publică. Cititorii care au salvat linkul vor primi pagina „404”.
          </DialogContentText>
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={deleteConfirmed}
                onChange={(event) => setDeleteConfirmed(event.target.checked)}
              />
            }
            label="Am înțeles că ștergerea nu poate fi anulată."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} color="inherit">
            Renunță
          </Button>
          <Button
            onClick={() => void handleDelete()}
            variant="contained"
            color="error"
            disabled={!deleteConfirmed || busyId !== null}
            loading={pendingDelete !== null && busyId === pendingDelete.id}
          >
            Șterge definitiv
          </Button>
        </DialogActions>
      </Dialog>

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
