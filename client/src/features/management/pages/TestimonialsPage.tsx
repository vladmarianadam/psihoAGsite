import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Rating,
  Stack,
  Switch,
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
  createTestimonial,
  deleteTestimonial,
  getAdminTestimonials,
  setTestimonialApproved,
  updateTestimonial,
} from '../../../api/testimonials'
import type { AdminTestimonialDto, TestimonialInput } from '../../../api/types'

const testimonialSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(1, 'Numele autorului este obligatoriu.')
    .max(100, 'Numele poate avea cel mult 100 de caractere.'),
  authorRole: z.string().trim().max(120, 'Rolul poate avea cel mult 120 de caractere.'),
  text: z
    .string()
    .trim()
    .min(1, 'Textul testimonialului este obligatoriu.')
    .max(2000, 'Textul poate avea cel mult 2000 de caractere.'),
  rating: z
    .number()
    .int('Ratingul trebuie să fie un număr întreg.')
    .min(1, 'Alege un rating între 1 și 5.')
    .max(5, 'Alege un rating între 1 și 5.'),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Ordinea trebuie să fie un număr întreg mai mare sau egal cu 0.'),
  isApproved: z.boolean(),
})

type TestimonialFormValues = z.infer<typeof testimonialSchema>

const emptyValues: TestimonialFormValues = {
  authorName: '',
  authorRole: '',
  text: '',
  rating: 5,
  displayOrder: '0',
  isApproved: false,
}

function truncate(value: string, maxLength = 140): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<AdminTestimonialDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminTestimonialDto | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminTestimonialDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAdminTestimonials()
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

  const openEdit = (testimonial: AdminTestimonialDto) => {
    setEditing(testimonial)
    setFormError(null)
    reset({
      authorName: testimonial.authorName,
      authorRole: testimonial.authorRole ?? '',
      text: testimonial.text,
      rating: testimonial.rating,
      displayOrder: String(testimonial.displayOrder),
      isApproved: testimonial.isApproved,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: TestimonialFormValues) => {
    setFormError(null)
    setActionError(null)

    const input: TestimonialInput = {
      authorName: values.authorName,
      authorRole: values.authorRole === '' ? null : values.authorRole,
      text: values.text,
      rating: values.rating,
      isApproved: values.isApproved,
      displayOrder: Number(values.displayOrder),
    }

    try {
      if (editing !== null) {
        await updateTestimonial(editing.id, input)
      } else {
        await createTestimonial(input)
      }
      setDialogOpen(false)
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const toggleApproved = async (testimonial: AdminTestimonialDto, isApproved: boolean) => {
    setActionError(null)
    setTogglingId(testimonial.id)
    try {
      await setTestimonialApproved(testimonial.id, isApproved)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const confirmDelete = async () => {
    if (deleteTarget === null) return

    setDeleting(true)
    setActionError(null)
    try {
      await deleteTestimonial(deleteTarget.id)
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
        title="Testimoniale"
        description="Testimonialele se publică doar cu acordul explicit al clientului și doar sub formă de iniciale sau prenume — niciodată cu nume complet ori cu detalii care ar permite identificarea. Un testimonial devine vizibil pe site numai după aprobare."
        actionLabel="Testimonial nou"
        onAction={openCreate}
        loading={loading}
        error={error}
        empty={items.length === 0}
        emptyMessage="Nu există încă niciun testimonial. Adaugă primul folosind butonul „Testimonial nou”."
      >
        <Paper variant="outlined">
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Autor</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Aprobat</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((testimonial) => (
                  <TableRow key={testimonial.id} hover>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {testimonial.authorName}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.authorRole ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 380 }}>
                      <Typography variant="body2" color="text.secondary">
                        {truncate(testimonial.text)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Rating
                        value={testimonial.rating}
                        readOnly
                        size="small"
                        aria-label={`Rating ${testimonial.rating} din 5`}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={testimonial.isApproved}
                        disabled={togglingId === testimonial.id}
                        onChange={(event) => void toggleApproved(testimonial, event.target.checked)}
                        slotProps={{
                          input: { 'aria-label': `Aprobat pentru publicare: ${testimonial.authorName}` },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Editează">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(testimonial)}
                            aria-label={`Editează testimonialul de la ${testimonial.authorName}`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Șterge">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(testimonial)}
                            aria-label={`Șterge testimonialul de la ${testimonial.authorName}`}
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
        aria-labelledby="dialog-testimonial-titlu"
      >
        <DialogTitle id="dialog-testimonial-titlu">
          {editing !== null ? 'Editează testimonialul' : 'Testimonial nou'}
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {formError !== null && <Alert severity="error">{formError}</Alert>}

              <Alert severity="info">
                Folosește doar iniciale sau prenumele, cu acordul persoanei. Elimină din text orice
                detaliu care ar putea duce la identificare.
              </Alert>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    {...register('authorName')}
                    label="Autor (iniciale sau prenume)"
                    autoFocus
                    error={errors.authorName !== undefined}
                    helperText={errors.authorName?.message ?? 'Ex.: „A. M.” sau „Maria”.'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    {...register('authorRole')}
                    label="Rol / context (opțional)"
                    error={errors.authorRole !== undefined}
                    helperText={errors.authorRole?.message ?? 'Ex.: „terapie individuală”.'}
                  />
                </Grid>
              </Grid>

              <TextField
                {...register('text')}
                label="Text"
                multiline
                minRows={5}
                error={errors.text !== undefined}
                helperText={errors.text?.message ?? 'Maximum 2000 de caractere.'}
              />

              <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="rating"
                    control={control}
                    render={({ field }) => (
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary" component="span" id="eticheta-rating">
                          Rating
                        </Typography>
                        <Rating
                          value={field.value}
                          onChange={(_event, value) => field.onChange(value ?? field.value)}
                          aria-labelledby="eticheta-rating"
                        />
                        {errors.rating !== undefined && (
                          <Typography variant="caption" color="error">
                            {errors.rating.message}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    {...register('displayOrder')}
                    label="Ordine"
                    inputMode="numeric"
                    error={errors.displayOrder !== undefined}
                    helperText={errors.displayOrder?.message}
                  />
                </Grid>
              </Grid>

              <Controller
                name="isApproved"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Aprobat pentru publicare pe site"
                  />
                )}
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
        aria-labelledby="dialog-stergere-testimonial"
      >
        <DialogTitle id="dialog-stergere-testimonial">Ștergi testimonialul?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Testimonialul de la <strong>{deleteTarget?.authorName}</strong> va fi șters definitiv.
          </Typography>
          <Alert severity="warning">
            Dacă vrei doar să îl retragi de pe site, dezactivează comutatorul „Aprobat” din tabel.
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
