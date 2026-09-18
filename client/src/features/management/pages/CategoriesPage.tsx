import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'

import CrudPageShell from '../components/CrudPageShell'
import { getErrorMessage } from '../../../api/client'
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from '../../../api/categories'
import type { AdminCategoryDto, CategoryInput } from '../../../api/types'

const slugPattern = /^[a-z0-9-]+$/

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Numele categoriei este obligatoriu.')
    .max(100, 'Numele poate avea cel mult 100 de caractere.'),
  slug: z
    .string()
    .trim()
    .max(120, 'Slugul poate avea cel mult 120 de caractere.')
    .refine(
      (value) => value === '' || slugPattern.test(value),
      'Slugul poate conține doar litere mici, cifre și cratime.',
    ),
  description: z.string().trim().max(500, 'Descrierea poate avea cel mult 500 de caractere.'),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Ordinea trebuie să fie un număr întreg mai mare sau egal cu 0.'),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const emptyValues: CategoryFormValues = { name: '', slug: '', description: '', displayOrder: '0' }

export default function CategoriesPage() {
  const [items, setItems] = useState<AdminCategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategoryDto | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAdminCategories()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = () => setReloadToken((token) => token + 1)

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    reset({ ...emptyValues, displayOrder: String(items.length + 1) })
    setDialogOpen(true)
  }

  const openEdit = (category: AdminCategoryDto) => {
    setEditing(category)
    setFormError(null)
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      displayOrder: String(category.displayOrder),
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: CategoryFormValues) => {
    setFormError(null)
    setActionError(null)

    const input: CategoryInput = {
      name: values.name,
      slug: values.slug === '' ? null : values.slug,
      description: values.description === '' ? null : values.description,
      displayOrder: Number(values.displayOrder),
    }

    try {
      if (editing !== null) {
        await updateCategory(editing.id, input)
      } else {
        await createCategory(input)
      }
      setDialogOpen(false)
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const confirmDelete = async () => {
    if (deleteTarget === null) return

    setDeleting(true)
    setActionError(null)
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <CrudPageShell
        title="Categorii"
        description="Categoriile organizează articolele din blog. Ordinea stabilită aici este cea în care apar în filtrele publice."
        actionLabel="Categorie nouă"
        onAction={openCreate}
        loading={loading}
        error={error}
        empty={items.length === 0}
        emptyMessage="Nu există încă nicio categorie. Adaugă prima folosind butonul „Categorie nouă”."
      >
        <Paper variant="outlined">
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nume</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Descriere</TableCell>
                  <TableCell align="right">Ordine</TableCell>
                  <TableCell align="right">Articole</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 340 }}>
                      <Typography variant="body2" color="text.secondary">
                        {category.description ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{category.displayOrder}</TableCell>
                    <TableCell align="right">{category.articleCount}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Editează">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(category)}
                            aria-label={`Editează categoria ${category.name}`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Șterge">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(category)}
                            aria-label={`Șterge categoria ${category.name}`}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </CrudPageShell>

      {actionError !== null && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* ------------------------------- Editare ------------------------------- */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="dialog-categorie-titlu"
      >
        <DialogTitle id="dialog-categorie-titlu">
          {editing !== null ? 'Editează categoria' : 'Categorie nouă'}
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {formError !== null && <Alert severity="error">{formError}</Alert>}

              <TextField
                {...register('name')}
                label="Nume"
                autoFocus
                error={errors.name !== undefined}
                helperText={errors.name?.message}
              />

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    {...register('slug')}
                    label="Slug (opțional)"
                    error={errors.slug !== undefined}
                    helperText={errors.slug?.message ?? 'Lasă gol pentru generare automată din nume.'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    {...register('displayOrder')}
                    label="Ordine"
                    inputMode="numeric"
                    error={errors.displayOrder !== undefined}
                    helperText={errors.displayOrder?.message}
                  />
                </Grid>
              </Grid>

              <TextField
                {...register('description')}
                label="Descriere (opțional)"
                multiline
                minRows={3}
                error={errors.description !== undefined}
                helperText={
                  errors.description?.message ?? 'Apare pe pagina de blog, sub titlul categoriei.'
                }
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Renunță
            </Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {editing !== null ? 'Salvează' : 'Adaugă'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ------------------------------ Confirmare ----------------------------- */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="dialog-stergere-categorie"
      >
        <DialogTitle id="dialog-stergere-categorie">Ștergi categoria?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Categoria <strong>{deleteTarget?.name}</strong> va fi ștearsă definitiv.
          </Typography>
          <Alert severity="warning">
            Articolele din această categorie rămân publicate, dar devin necategorizate. Le poți
            reatribui oricând din editorul de articole.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Renunță
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" loading={deleting}>
            Șterge
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
