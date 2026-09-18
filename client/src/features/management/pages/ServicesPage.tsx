import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
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
import RichTextEditor from '../components/RichTextEditor'
import { getErrorMessage } from '../../../api/client'
import {
  createService,
  deleteService,
  getAdminServices,
  updateService,
} from '../../../api/services'
import { sessionModeLabels } from '../../../api/types'
import type { AdminServiceDto, ServiceInput, SessionMode } from '../../../api/types'
import { formatPriceRo } from '../../../components/common/formatters'

const slugPattern = /^[a-z0-9-]+$/
const sessionModes: SessionMode[] = ['Cabinet', 'Online', 'Both']

const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Numele serviciului este obligatoriu.')
    .max(150, 'Numele poate avea cel mult 150 de caractere.'),
  slug: z
    .string()
    .trim()
    .max(160, 'Slugul poate avea cel mult 160 de caractere.')
    .refine(
      (value) => value === '' || slugPattern.test(value),
      'Slugul poate conține doar litere mici, cifre și cratime.',
    ),
  shortDescription: z
    .string()
    .trim()
    .min(1, 'Descrierea scurtă este obligatorie.')
    .max(500, 'Descrierea scurtă poate avea cel mult 500 de caractere.'),
  longDescriptionHtml: z.string(),
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d+([.,]\d{1,2})?$/.test(value),
      'Prețul trebuie să fie un număr mai mare sau egal cu 0.',
    ),
  priceUnit: z.string().trim().max(60, 'Unitatea de preț poate avea cel mult 60 de caractere.'),
  durationMinutes: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Durata trebuie să fie un număr întreg de minute.')
    .refine((value) => Number(value) <= 480, 'Durata poate fi de cel mult 480 de minute.'),
  iconName: z.string().trim().max(60, 'Numele iconiței poate avea cel mult 60 de caractere.'),
  imageUrl: z.string().trim().max(500, 'Adresa imaginii poate avea cel mult 500 de caractere.'),
  sessionMode: z.enum(['Cabinet', 'Online', 'Both']),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Ordinea trebuie să fie un număr întreg mai mare sau egal cu 0.'),
  isActive: z.boolean(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

const emptyValues: ServiceFormValues = {
  name: '',
  slug: '',
  shortDescription: '',
  longDescriptionHtml: '',
  price: '',
  priceUnit: '/ ședință',
  durationMinutes: '50',
  iconName: '',
  imageUrl: '',
  sessionMode: 'Both',
  displayOrder: '0',
  isActive: true,
}

/** Reconstruiește corpul cererii dintr-un serviciu existent (PUT-ul cere toate câmpurile). */
function toServiceInput(service: AdminServiceDto): ServiceInput {
  return {
    name: service.name,
    slug: service.slug,
    shortDescription: service.shortDescription,
    longDescriptionHtml: service.longDescriptionHtml,
    price: service.price,
    priceUnit: service.priceUnit,
    durationMinutes: service.durationMinutes,
    iconName: service.iconName,
    imageUrl: service.imageUrl,
    sessionMode: service.sessionMode,
    displayOrder: service.displayOrder,
    isActive: service.isActive,
  }
}

export default function ServicesPage() {
  const [items, setItems] = useState<AdminServiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminServiceDto | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminServiceDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAdminServices()
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

  const openEdit = (service: AdminServiceDto) => {
    setEditing(service)
    setFormError(null)
    reset({
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      longDescriptionHtml: service.longDescriptionHtml ?? '',
      price: service.price === null ? '' : String(service.price),
      priceUnit: service.priceUnit ?? '',
      durationMinutes: String(service.durationMinutes),
      iconName: service.iconName ?? '',
      imageUrl: service.imageUrl ?? '',
      sessionMode: service.sessionMode,
      displayOrder: String(service.displayOrder),
      isActive: service.isActive,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setFormError(null)
    setActionError(null)

    const input: ServiceInput = {
      name: values.name,
      slug: values.slug === '' ? null : values.slug,
      shortDescription: values.shortDescription,
      longDescriptionHtml: values.longDescriptionHtml === '' ? null : values.longDescriptionHtml,
      price: values.price === '' ? null : Number(values.price.replace(',', '.')),
      priceUnit: values.priceUnit === '' ? null : values.priceUnit,
      durationMinutes: Number(values.durationMinutes),
      iconName: values.iconName === '' ? null : values.iconName,
      imageUrl: values.imageUrl === '' ? null : values.imageUrl,
      sessionMode: values.sessionMode,
      displayOrder: Number(values.displayOrder),
      isActive: values.isActive,
    }

    try {
      if (editing !== null) {
        await updateService(editing.id, input)
      } else {
        await createService(input)
      }
      setDialogOpen(false)
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  /** Comutatorul din tabel salvează imediat, fără dialog. */
  const toggleActive = async (service: AdminServiceDto, isActive: boolean) => {
    setActionError(null)
    setTogglingId(service.id)
    try {
      await updateService(service.id, { ...toServiceInput(service), isActive })
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
      await deleteService(deleteTarget.id)
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
        title="Servicii"
        description="Serviciile apar pe pagina publică în ordinea stabilită aici. Serviciile inactive rămân salvate, dar nu mai sunt vizibile pe site."
        actionLabel="Serviciu nou"
        onAction={openCreate}
        loading={loading}
        error={error}
        empty={items.length === 0}
        emptyMessage="Nu există încă niciun serviciu. Adaugă primul folosind butonul „Serviciu nou”."
      >
        <Paper variant="outlined">
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nume</TableCell>
                  <TableCell>Preț</TableCell>
                  <TableCell>Durată</TableCell>
                  <TableCell>Mod de desfășurare</TableCell>
                  <TableCell align="right">Ordine</TableCell>
                  <TableCell>Activ</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((service) => {
                  const price = formatPriceRo(service.price)

                  return (
                    <TableRow key={service.id} hover>
                      <TableCell sx={{ fontWeight: 600, maxWidth: 280 }}>
                        {service.name}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', fontWeight: 400, fontFamily: 'monospace' }}
                        >
                          {service.slug}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {price === null ? (
                          <Typography variant="body2" color="text.secondary">
                            La cerere
                          </Typography>
                        ) : (
                          <>
                            {price}
                            {service.priceUnit !== null && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {service.priceUnit}
                              </Typography>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{service.durationMinutes} min</TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={sessionModeLabels[service.sessionMode]} />
                      </TableCell>
                      <TableCell align="right">{service.displayOrder}</TableCell>
                      <TableCell>
                        <Switch
                          checked={service.isActive}
                          disabled={togglingId === service.id}
                          onChange={(event) => void toggleActive(service, event.target.checked)}
                          slotProps={{ input: { 'aria-label': `Serviciu activ: ${service.name}` } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          <Tooltip title="Editează">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(service)}
                              aria-label={`Editează serviciul ${service.name}`}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Șterge">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(service)}
                              aria-label={`Șterge serviciul ${service.name}`}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
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
        maxWidth="md"
        fullWidth
        aria-labelledby="dialog-serviciu-titlu"
      >
        <DialogTitle id="dialog-serviciu-titlu">
          {editing !== null ? 'Editează serviciul' : 'Serviciu nou'}
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {formError !== null && <Alert severity="error">{formError}</Alert>}

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    {...register('name')}
                    label="Nume"
                    autoFocus
                    error={errors.name !== undefined}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    {...register('slug')}
                    label="Slug (opțional)"
                    error={errors.slug !== undefined}
                    helperText={errors.slug?.message ?? 'Gol = generat din nume.'}
                  />
                </Grid>
              </Grid>

              <TextField
                {...register('shortDescription')}
                label="Descriere scurtă"
                multiline
                minRows={3}
                error={errors.shortDescription !== undefined}
                helperText={
                  errors.shortDescription?.message ?? 'Apare pe cardul din pagina de servicii.'
                }
              />

              <Box>
                <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
                  Descriere detaliată
                </Typography>
                <Controller
                  name="longDescriptionHtml"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value} onChange={field.onChange} />
                  )}
                />
              </Box>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    {...register('price')}
                    label="Preț (opțional)"
                    inputMode="decimal"
                    error={errors.price !== undefined}
                    helperText={errors.price?.message ?? 'Gol = „La cerere”.'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    {...register('priceUnit')}
                    label="Unitate de preț"
                    error={errors.priceUnit !== undefined}
                    helperText={errors.priceUnit?.message ?? 'Ex.: „/ ședință 50 min”.'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    {...register('durationMinutes')}
                    label="Durată (minute)"
                    inputMode="numeric"
                    error={errors.durationMinutes !== undefined}
                    helperText={errors.durationMinutes?.message}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="sessionMode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Mod de desfășurare"
                        error={errors.sessionMode !== undefined}
                        helperText={errors.sessionMode?.message}
                      >
                        {sessionModes.map((mode) => (
                          <MenuItem key={mode} value={mode}>
                            {sessionModeLabels[mode]}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    {...register('iconName')}
                    label="Iconiță (opțional)"
                    error={errors.iconName !== undefined}
                    helperText={errors.iconName?.message ?? 'Nume de iconiță MUI, ex.: „Psychology”.'}
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
                {...register('imageUrl')}
                label="Imagine (adresă, opțional)"
                error={errors.imageUrl !== undefined}
                helperText={
                  errors.imageUrl?.message ?? 'Lasă gol dacă nu există încă o fotografie potrivită.'
                }
              />

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label="Serviciu activ (vizibil pe site)"
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
        aria-labelledby="dialog-stergere-serviciu"
      >
        <DialogTitle id="dialog-stergere-serviciu">Ștergi serviciul?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Serviciul <strong>{deleteTarget?.name}</strong> va fi șters definitiv.
          </Typography>
          <Alert severity="warning">
            Dacă vrei doar să îl ascunzi temporar de pe site, dezactivează-l cu comutatorul „Activ”
            din tabel.
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
