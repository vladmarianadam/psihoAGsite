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
  IconButton,
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
import { createFaqItem, deleteFaqItem, getAdminFaq, updateFaqItem } from '../../../api/faq'
import type { AdminFaqItemDto, FaqItemInput } from '../../../api/types'

/** Textul vizibil dintr-un fragment HTML, pentru validare și pentru previzualizare în tabel. */
function htmlToPlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const faqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Întrebarea este obligatorie.')
    .max(300, 'Întrebarea poate avea cel mult 300 de caractere.'),
  answerHtml: z.string().refine((value) => htmlToPlainText(value).length > 0, 'Răspunsul este obligatoriu.'),
  displayOrder: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Ordinea trebuie să fie un număr întreg mai mare sau egal cu 0.'),
  isActive: z.boolean(),
})

type FaqFormValues = z.infer<typeof faqSchema>

const emptyValues: FaqFormValues = {
  question: '',
  answerHtml: '',
  displayOrder: '0',
  isActive: true,
}

function toFaqInput(item: AdminFaqItemDto): FaqItemInput {
  return {
    question: item.question,
    answerHtml: item.answerHtml,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }
}

export default function FaqPage() {
  const [items, setItems] = useState<AdminFaqItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFaqItemDto | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AdminFaqItemDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAdminFaq()
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

  const openEdit = (item: AdminFaqItemDto) => {
    setEditing(item)
    setFormError(null)
    reset({
      question: item.question,
      answerHtml: item.answerHtml,
      displayOrder: String(item.displayOrder),
      isActive: item.isActive,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: FaqFormValues) => {
    setFormError(null)
    setActionError(null)

    const input: FaqItemInput = {
      question: values.question,
      answerHtml: values.answerHtml,
      displayOrder: Number(values.displayOrder),
      isActive: values.isActive,
    }

    try {
      if (editing !== null) {
        await updateFaqItem(editing.id, input)
      } else {
        await createFaqItem(input)
      }
      setDialogOpen(false)
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const toggleActive = async (item: AdminFaqItemDto, isActive: boolean) => {
    setActionError(null)
    setTogglingId(item.id)
    try {
      await updateFaqItem(item.id, { ...toFaqInput(item), isActive })
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
      await deleteFaqItem(deleteTarget.id)
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
        title="Întrebări frecvente"
        description="Răspunsurile apar pe site în ordinea stabilită aici și sunt folosite și pentru datele structurate FAQ din pagina principală."
        actionLabel="Întrebare nouă"
        onAction={openCreate}
        loading={loading}
        error={error}
        empty={items.length === 0}
        emptyMessage="Nu există încă nicio întrebare. Adaugă prima folosind butonul „Întrebare nouă”."
      >
        <Paper variant="outlined">
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Întrebarea</TableCell>
                  <TableCell align="right">Ordine</TableCell>
                  <TableCell>Activ</TableCell>
                  <TableCell align="right">Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ maxWidth: 620 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.question}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {htmlToPlainText(item.answerHtml)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.displayOrder}</TableCell>
                    <TableCell>
                      <Switch
                        checked={item.isActive}
                        disabled={togglingId === item.id}
                        onChange={(event) => void toggleActive(item, event.target.checked)}
                        slotProps={{ input: { 'aria-label': `Întrebare activă: ${item.question}` } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Editează">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(item)}
                            aria-label={`Editează întrebarea: ${item.question}`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Șterge">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`Șterge întrebarea: ${item.question}`}
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
        maxWidth="md"
        fullWidth
        aria-labelledby="dialog-intrebare-titlu"
      >
        <DialogTitle id="dialog-intrebare-titlu">
          {editing !== null ? 'Editează întrebarea' : 'Întrebare nouă'}
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {formError !== null && <Alert severity="error">{formError}</Alert>}

              <TextField
                {...register('question')}
                label="Întrebarea"
                autoFocus
                multiline
                minRows={2}
                error={errors.question !== undefined}
                helperText={errors.question?.message ?? 'Maximum 300 de caractere.'}
              />

              <Box>
                <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
                  Răspunsul
                </Typography>
                <Controller
                  name="answerHtml"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.answerHtml !== undefined && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                    {errors.answerHtml.message}
                  </Typography>
                )}
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'center' } }}>
                <TextField
                  {...register('displayOrder')}
                  label="Ordine"
                  inputMode="numeric"
                  error={errors.displayOrder !== undefined}
                  helperText={errors.displayOrder?.message}
                  sx={{ maxWidth: { sm: 160 } }}
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
                      label="Vizibilă pe site"
                    />
                  )}
                />
              </Stack>
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
        aria-labelledby="dialog-stergere-intrebare"
      >
        <DialogTitle id="dialog-stergere-intrebare">Ștergi întrebarea?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Întrebarea „{deleteTarget?.question}” va fi ștearsă definitiv, împreună cu răspunsul ei.
          </Typography>
          <Alert severity="warning">
            Dacă vrei doar să o ascunzi de pe site, dezactivează comutatorul „Activ” din tabel.
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
