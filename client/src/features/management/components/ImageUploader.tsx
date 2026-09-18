import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import { getErrorMessage } from '../../../api/client'
import { uploadImage } from '../../../api/media'

export interface ImageUploaderProps {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  altText?: string | null
  /** Când e dat, componenta afișează și câmpul pentru textul alternativ. */
  onAltTextChange?: (alt: string) => void
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_ALT_LENGTH = 200

/** Validare în client, ca utilizatorul să afle problema înainte de a aștepta upload-ul. */
function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Formatul nu este acceptat. Alege o imagine .jpg, .png sau .webp.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return `Imaginea are ${sizeMb} MB, iar limita este de 5 MB. Redimensionează-o și încearcă din nou.`
  }
  return null
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Imagine de copertă',
  altText,
  onAltTextChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const upload = async (file: File) => {
    const validationError = validateImage(file)
    if (validationError !== null) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const asset = await uploadImage(file, altText ?? undefined)
      if (!mountedRef.current) return
      onChange(asset.url)
      // Textul alternativ propus de server (dacă există) ajută la accesibilitate.
      if (onAltTextChange && !altText && asset.altText) onAltTextChange(asset.altText)
    } catch (uploadError) {
      if (mountedRef.current) {
        setError(getErrorMessage(uploadError, 'Imaginea nu a putut fi încărcată.'))
      }
    } finally {
      if (mountedRef.current) setUploading(false)
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Resetăm câmpul, ca același fișier să poată fi ales din nou după o eroare.
    event.target.value = ''
    if (file) void upload(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (uploading) return

    const file = event.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!uploading) setDragActive(true)
  }

  const altValue = altText ?? ''

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" component="p" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>

      {value ? (
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={value}
            alt={altValue}
            loading="lazy"
            decoding="async"
            sx={{
              display: 'block',
              width: '100%',
              maxHeight: 220,
              objectFit: 'cover',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
            }}
          />
          <Tooltip title="Elimină imaginea">
            <IconButton
              onClick={() => {
                setError(null)
                onChange(null)
              }}
              aria-label="Elimină imaginea de copertă"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragActive(false)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            px: 2,
            py: 3.5,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: (theme) =>
              dragActive ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
            transition: 'border-color .2s ease, background-color .2s ease',
          }}
        >
          <AddPhotoAlternateOutlinedIcon color="disabled" />
          <Typography variant="body2" color="text.secondary">
            Trage o imagine aici sau alege un fișier din calculator.
          </Typography>
          <Button
            onClick={() => inputRef.current?.click()}
            size="small"
            variant="outlined"
            disabled={uploading}
          >
            Alege imaginea
          </Button>
          <Typography variant="caption" color="text.secondary">
            Formate acceptate: .jpg, .png, .webp · maximum 5 MB
          </Typography>
        </Box>
      )}

      {uploading && (
        <Box>
          <LinearProgress aria-label="Se încarcă imaginea" />
          <Typography variant="caption" color="text.secondary">
            Se încarcă imaginea…
          </Typography>
        </Box>
      )}

      {error !== null && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {value && (
        <Button
          onClick={() => inputRef.current?.click()}
          size="small"
          color="inherit"
          disabled={uploading}
          sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
        >
          Înlocuiește imaginea
        </Button>
      )}

      {onAltTextChange !== undefined && (
        <TextField
          label="Text alternativ"
          value={altValue}
          onChange={(event) => onAltTextChange(event.target.value.slice(0, MAX_ALT_LENGTH))}
          size="small"
          helperText="Descrie pe scurt ce se vede în imagine: cititorii care folosesc cititoare de ecran aud acest text, iar motoarele de căutare îl folosesc pentru a înțelege imaginea."
          slotProps={{ htmlInput: { maxLength: MAX_ALT_LENGTH } }}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </Stack>
  )
}
