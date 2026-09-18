import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import { getErrorMessage } from '../../../api/client'
import { getAdminCategories } from '../../../api/categories'
import { uploadImage } from '../../../api/media'
import { articleStatusLabels } from '../../../api/types'
import type { AdminArticleDetailDto, AdminCategoryDto, ArticleInput } from '../../../api/types'
import { formatDateTimeRo } from '../../../components/common/formatters'
import ImageUploader from './ImageUploader'
import RichTextEditor from './RichTextEditor'

/** Salvarea declanșată din exterior (autosalvarea din pagină). `true` = s-a salvat. */
export type ArticleAutoSaveTrigger = () => Promise<boolean>

export interface ArticleFormProps {
  initial?: AdminArticleDetailDto
  onSubmit: (input: ArticleInput, publish: boolean) => Promise<void>
  saving: boolean
  onDirtyChange?: (dirty: boolean) => void
  /**
   * Adăugare peste contractul minim: pagina primește aici un declanșator de salvare,
   * ca autosalvarea (interval + indicator) să rămână în `ArticleEditorPage`.
   */
  autoSaveRef?: RefObject<ArticleAutoSaveTrigger | null>
}

const META_TITLE_RECOMMENDED = 60
const META_DESCRIPTION_RECOMMENDED = 160

const SLUG_PATTERN = /^[a-z0-9-]+$/

/** Conținut real: text vizibil sau cel puțin o imagine. `<p></p>` nu se califică. */
function hasEditorContent(html: string): boolean {
  if (!html) return false
  if (/<img\b/i.test(html)) return true

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > 0
}

/**
 * Aceleași reguli ca `SlugHelper.Generate` de pe server: diacriticele românești sunt
 * transliterate (ă→a, â→a, î→i, ș→s, ț→t), „&" devine „si", restul devine cratimă.
 */
function generateSlug(input: string, maxLength = 200): string {
  if (!input.trim()) return ''

  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a')
    .replace(/î/g, 'i')
    .replace(/&/g, ' si ')

  // Restul semnelor diacritice se elimină din forma descompusă (ca `NonSpacingMark` în C#).
  const withoutMarks = normalized.normalize('NFD').replace(/[̀-ͯ]/g, '')

  const slug = withoutMarks
    .normalize('NFC')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  return slug.length > maxLength ? slug.slice(0, maxLength).replace(/-+$/, '') : slug
}

const articleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Titlul este obligatoriu.')
    .max(200, 'Titlul poate avea cel mult 200 de caractere.'),
  slug: z
    .string()
    .trim()
    .max(200, 'Adresa poate avea cel mult 200 de caractere.')
    .refine(
      (value) => value === '' || SLUG_PATTERN.test(value),
      'Adresa poate conține doar litere mici fără diacritice, cifre și cratime.',
    ),
  excerpt: z
    .string()
    .trim()
    .min(1, 'Rezumatul este obligatoriu.')
    .max(500, 'Rezumatul poate avea cel mult 500 de caractere.'),
  contentHtml: z
    .string()
    .refine(hasEditorContent, 'Conținutul articolului este obligatoriu.'),
  coverImageUrl: z.string().nullable(),
  coverImageAlt: z
    .string()
    .trim()
    .max(200, 'Textul alternativ poate avea cel mult 200 de caractere.'),
  categoryId: z.string(),
  metaTitle: z
    .string()
    .trim()
    .max(200, 'Meta-titlul poate avea cel mult 200 de caractere.'),
  metaDescription: z
    .string()
    .trim()
    .max(300, 'Meta-descrierea poate avea cel mult 300 de caractere.'),
})

type ArticleFormValues = z.infer<typeof articleSchema>

function toFormValues(initial?: AdminArticleDetailDto): ArticleFormValues {
  return {
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    contentHtml: initial?.contentHtml ?? '',
    coverImageUrl: initial?.coverImageUrl ?? null,
    coverImageAlt: initial?.coverImageAlt ?? '',
    categoryId:
      initial?.categoryId === null || initial?.categoryId === undefined
        ? ''
        : String(initial.categoryId),
    metaTitle: initial?.metaTitle ?? '',
    metaDescription: initial?.metaDescription ?? '',
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toInput(values: ArticleFormValues): ArticleInput {
  return {
    title: values.title.trim(),
    slug: emptyToNull(values.slug),
    excerpt: values.excerpt.trim(),
    contentHtml: values.contentHtml,
    coverImageUrl: emptyToNull(values.coverImageUrl ?? ''),
    coverImageAlt: emptyToNull(values.coverImageAlt),
    categoryId: values.categoryId === '' ? null : Number(values.categoryId),
    metaTitle: emptyToNull(values.metaTitle),
    metaDescription: emptyToNull(values.metaDescription),
  }
}

/** Estimare de lectură pentru previzualizare (serverul recalculează la salvare). */
function estimateReadingMinutes(html: string): number {
  const words = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return Math.max(1, Math.round(words / 200))
}

export default function ArticleForm({
  initial,
  onSubmit,
  saving,
  onDirtyChange,
  autoSaveRef,
}: ArticleFormProps) {
  const isExisting = initial !== undefined
  const isPublished = initial?.status === 'Published'

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors, isDirty },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: toFormValues(initial),
    mode: 'onBlur',
  })

  const values = watch()

  const [categories, setCategories] = useState<AdminCategoryDto[]>([])
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  // Slug-ul se generează automat doar cât timp nu a fost atins de utilizator.
  const [slugEdited, setSlugEdited] = useState(isExisting)

  const loadedIdRef = useRef<number | null>(initial?.id ?? null)
  const dirtyRef = useRef(false)
  const publishedRef = useRef(isPublished)
  const onSubmitRef = useRef(onSubmit)

  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  useEffect(() => {
    publishedRef.current = isPublished
  }, [isPublished])

  useEffect(() => {
    dirtyRef.current = isDirty
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Categoriile pentru select — eroarea rămâne informativă, nu blochează salvarea.
  useEffect(() => {
    let cancelled = false

    getAdminCategories()
      .then((result) => {
        if (!cancelled) setCategories(result)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCategoriesError(getErrorMessage(error, 'Categoriile nu au putut fi încărcate.'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Articolul încărcat din API ajunge în formular o singură dată, la schimbarea id-ului.
  useEffect(() => {
    const id = initial?.id ?? null
    if (id === loadedIdRef.current) return

    loadedIdRef.current = id
    reset(toFormValues(initial))
    setSlugEdited(initial !== undefined)
  }, [initial, reset])

  // Generare automată a adresei, doar pentru articole noi și doar înainte de editare manuală.
  useEffect(() => {
    if (isExisting || slugEdited) return

    const generated = generateSlug(values.title)
    if (generated !== getValues('slug')) {
      setValue('slug', generated, { shouldDirty: false, shouldValidate: false })
    }
  }, [values.title, isExisting, slugEdited, getValues, setValue])

  const persist = useCallback(
    async (formValues: ArticleFormValues, publish: boolean): Promise<boolean> => {
      try {
        await onSubmitRef.current(toInput(formValues), publish)
        // Valorile salvate devin noile valori implicite: formularul nu mai e „modificat".
        reset(formValues)
        return true
      } catch {
        // Mesajul de eroare e afișat de pagină, care cunoaște contextul salvării.
        return false
      }
    },
    [reset],
  )

  // Declanșatorul de autosalvare: validează, apoi salvează fără să schimbe starea publicării.
  useEffect(() => {
    if (!autoSaveRef) return

    autoSaveRef.current = async () => {
      if (!dirtyRef.current) return false

      const valid = await trigger()
      if (!valid) return false

      return persist(getValues(), publishedRef.current)
    }

    return () => {
      autoSaveRef.current = null
    }
  }, [autoSaveRef, getValues, persist, trigger])

  const handleEditorImageUpload = useCallback(async (file: File): Promise<string> => {
    const asset = await uploadImage(file)
    return asset.url
  }, [])

  const submitAsDraftOrKeep = handleSubmit((formValues) => persist(formValues, isPublished))
  const submitWithPublish = handleSubmit((formValues) => persist(formValues, true))
  const submitWithUnpublish = handleSubmit((formValues) => persist(formValues, false))

  const metaTitleLength = values.metaTitle.length
  const metaDescriptionLength = values.metaDescription.length
  const metaTitleTooLong = metaTitleLength > META_TITLE_RECOMMENDED
  const metaDescriptionTooLong = metaDescriptionLength > META_DESCRIPTION_RECOMMENDED

  const previewTitle = values.title.trim() === '' ? 'Articol fără titlu' : values.title
  const previewCategory = categories.find((category) => String(category.id) === values.categoryId)
  const previewHtml = DOMPurify.sanitize(values.contentHtml)

  return (
    <Box component="form" onSubmit={submitAsDraftOrKeep} noValidate>
      <Grid container spacing={3}>
        {/* --------------------------- Coloana principală --------------------------- */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack spacing={2.5}>
                  <TextField
                    {...register('title')}
                    label="Titlu"
                    placeholder="Ex.: Cum recunoaștem semnele anxietății"
                    error={errors.title !== undefined}
                    helperText={errors.title?.message ?? `${values.title.length}/200 caractere`}
                    autoFocus={!isExisting}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
                    <TextField
                      {...register('slug', { onChange: () => setSlugEdited(true) })}
                      label="Adresa articolului (slug)"
                      placeholder="cum-recunoastem-semnele-anxietatii"
                      error={errors.slug !== undefined}
                      helperText={
                        errors.slug?.message ??
                        'Apare în adresa publică: /blog/adresa-articolului. Lasă gol pentru generare automată pe server.'
                      }
                    />
                    <Button
                      onClick={() => {
                        setValue('slug', generateSlug(getValues('title')), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                      startIcon={<AutoFixHighOutlinedIcon fontSize="small" />}
                      color="inherit"
                      sx={{ mt: { sm: 1 }, flexShrink: 0, color: 'text.secondary' }}
                    >
                      Generează din titlu
                    </Button>
                  </Stack>

                  <TextField
                    {...register('excerpt')}
                    label="Rezumat"
                    placeholder="Două-trei propoziții care descriu articolul. Apar în listă și în rezultatele căutării."
                    multiline
                    minRows={3}
                    error={errors.excerpt !== undefined}
                    helperText={errors.excerpt?.message ?? `${values.excerpt.length}/500 caractere`}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Box>
              <Typography variant="subtitle2" component="h2" sx={{ mb: 1, fontWeight: 600 }}>
                Conținutul articolului
              </Typography>

              <Controller
                control={control}
                name="contentHtml"
                render={({ field, fieldState }) => (
                  <Box>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      onImageUpload={handleEditorImageUpload}
                      minHeight={480}
                    />
                    {fieldState.error?.message !== undefined && (
                      <FormHelperText error sx={{ mx: 1.75 }}>
                        {fieldState.error.message}
                      </FormHelperText>
                    )}
                  </Box>
                )}
              />
            </Box>
          </Stack>
        </Grid>

        {/* ----------------------------- Coloana laterală ---------------------------- */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                      Stare
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip
                        label={articleStatusLabels[initial?.status ?? 'Draft']}
                        color={isPublished ? 'success' : 'default'}
                        size="small"
                        variant={isPublished ? 'filled' : 'outlined'}
                      />
                      {isDirty && (
                        <Typography variant="caption" color="warning.main">
                          Modificări nesalvate
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {initial !== undefined && (
                    <Stack spacing={0.5}>
                      {initial.publishedAt !== null && (
                        <Typography variant="caption" color="text.secondary">
                          Publicat: {formatDateTimeRo(initial.publishedAt)}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Ultima modificare: {formatDateTimeRo(initial.updatedAt ?? initial.createdAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vizualizări: {initial.viewCount}
                      </Typography>
                    </Stack>
                  )}

                  <Divider />

                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel id="article-category-label">Categorie</InputLabel>
                        <Select
                          labelId="article-category-label"
                          label="Categorie"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                          onBlur={field.onBlur}
                        >
                          <MenuItem value="">Fără categorie</MenuItem>
                          {categories.map((category) => (
                            <MenuItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {categoriesError ?? 'Ajută cititorii să găsească articole pe aceeași temă.'}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <ImageUploader
                  value={values.coverImageUrl}
                  onChange={(url) => setValue('coverImageUrl', url, { shouldDirty: true })}
                  altText={values.coverImageAlt}
                  onAltTextChange={(alt) =>
                    setValue('coverImageAlt', alt, { shouldDirty: true, shouldValidate: true })
                  }
                />
                {errors.coverImageAlt?.message !== undefined && (
                  <FormHelperText error>{errors.coverImageAlt.message}</FormHelperText>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Optimizare pentru căutare
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dacă lași câmpurile goale, se folosesc titlul și rezumatul articolului.
                </Typography>

                <Stack spacing={2.5} sx={{ mt: 2 }}>
                  <TextField
                    {...register('metaTitle')}
                    label="Meta-titlu"
                    error={errors.metaTitle !== undefined}
                    helperText={
                      errors.metaTitle?.message ??
                      `${metaTitleLength}/${META_TITLE_RECOMMENDED} caractere recomandate${
                        metaTitleTooLong ? ' — Google poate trunchia titlul.' : ''
                      }`
                    }
                    slotProps={{
                      formHelperText: {
                        sx:
                          metaTitleTooLong && errors.metaTitle === undefined
                            ? { color: 'warning.main' }
                            : undefined,
                      },
                    }}
                  />

                  <TextField
                    {...register('metaDescription')}
                    label="Meta-descriere"
                    multiline
                    minRows={3}
                    error={errors.metaDescription !== undefined}
                    helperText={
                      errors.metaDescription?.message ??
                      `${metaDescriptionLength}/${META_DESCRIPTION_RECOMMENDED} caractere recomandate${
                        metaDescriptionTooLong ? ' — textul poate fi tăiat în rezultatele căutării.' : ''
                      }`
                    }
                    slotProps={{
                      formHelperText: {
                        sx:
                          metaDescriptionTooLong && errors.metaDescription === undefined
                            ? { color: 'warning.main' }
                            : undefined,
                      },
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* -------------------------------- Acțiuni -------------------------------- */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          mt: 3,
          py: 2,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 2,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <Button
            type="submit"
            variant="contained"
            loading={saving}
            startIcon={<SaveOutlinedIcon fontSize="small" />}
          >
            {isPublished ? 'Salvează modificările' : 'Salvează ca ciornă'}
          </Button>

          {isPublished ? (
            <Button
              onClick={submitWithUnpublish}
              variant="outlined"
              color="warning"
              disabled={saving}
              startIcon={<UnpublishedOutlinedIcon fontSize="small" />}
            >
              Retrage din publicare
            </Button>
          ) : (
            <Button
              onClick={submitWithPublish}
              variant="outlined"
              disabled={saving}
              startIcon={<PublishOutlinedIcon fontSize="small" />}
            >
              Publică
            </Button>
          )}

          <Button
            onClick={() => setPreviewOpen(true)}
            color="inherit"
            disabled={saving}
            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
            sx={{ color: 'text.secondary' }}
          >
            Previzualizare
          </Button>
        </Stack>
      </Box>

      {/* ----------------------------- Previzualizare ----------------------------- */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="article-preview-title"
      >
        <DialogTitle id="article-preview-title">Previzualizare</DialogTitle>
        <DialogContent dividers>
          {!hasEditorContent(values.contentHtml) && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Articolul nu are încă conținut. Scrie textul în editor, apoi revino la previzualizare.
            </Alert>
          )}

          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1.5 }}>
            {previewTitle}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 2, alignItems: 'center' }}
          >
            {previewCategory && <Chip label={previewCategory.name} size="small" />}
            <Typography variant="body2" color="text.secondary">
              {formatDateTimeRo(initial?.publishedAt ?? new Date().toISOString())} ·{' '}
              {estimateReadingMinutes(values.contentHtml)} min de lectură
            </Typography>
          </Stack>

          {values.excerpt.trim() !== '' && (
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              {values.excerpt}
            </Typography>
          )}

          {values.coverImageUrl !== null && values.coverImageUrl !== '' && (
            <Box
              component="img"
              src={values.coverImageUrl}
              alt={values.coverImageAlt}
              loading="lazy"
              decoding="async"
              sx={{ display: 'block', width: '100%', borderRadius: 2, mb: 3 }}
            />
          )}

          <div className="article-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} variant="contained">
            Închide
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
