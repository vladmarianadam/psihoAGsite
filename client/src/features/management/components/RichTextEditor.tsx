import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Editor } from '@tiptap/react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import InsertLinkIcon from '@mui/icons-material/InsertLink'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter'
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'

import { getErrorMessage } from '../../../api/client'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  /** Încarcă fișierul și întoarce URL-ul public al imaginii. */
  onImageUpload?: (file: File) => Promise<string>
  minHeight?: number
  placeholder?: string
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_RULES_MESSAGE =
  'Sunt permise doar imagini .jpg, .png sau .webp, de maximum 5 MB.'

/** Fișierele imagine dintr-un `FileList` (drop sau lipire), filtrate după tip. */
function pickImageFiles(list: FileList | null | undefined): File[] {
  if (!list) return []
  return Array.from(list).filter((file) => file.type.startsWith('image/'))
}

function isAcceptedImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES
}

interface ToolbarState {
  isEmpty: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  heading2: boolean
  heading3: boolean
  bulletList: boolean
  orderedList: boolean
  blockquote: boolean
  link: boolean
  alignLeft: boolean
  alignCenter: boolean
  alignRight: boolean
  canBold: boolean
  canItalic: boolean
  canUnderline: boolean
  canHeading: boolean
  canBulletList: boolean
  canOrderedList: boolean
  canBlockquote: boolean
  canAlign: boolean
  canUndo: boolean
  canRedo: boolean
}

/** Bara de instrumente în stare neutră, cât timp ProseMirror nu are încă view. */
const EMPTY_TOOLBAR_STATE: ToolbarState = {
  isEmpty: true,
  bold: false,
  italic: false,
  underline: false,
  heading2: false,
  heading3: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  link: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  canBold: false,
  canItalic: false,
  canUnderline: false,
  canHeading: false,
  canBulletList: false,
  canOrderedList: false,
  canBlockquote: false,
  canAlign: false,
  canUndo: false,
  canRedo: false,
}

/**
 * Completează schema lipsă, ca „exemplu.ro” să devină un link valid. Căile interne
 * și adresele de e-mail rămân neatinse.
 */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  if (trimmed.includes('@') && !trimmed.includes('/')) return `mailto:${trimmed}`
  return `https://${trimmed}`
}

export default function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  minHeight = 420,
  placeholder = 'Scrie aici conținutul articolului…',
}: RichTextEditorProps) {
  // Referințele țin callback-urile la zi fără să reconstruiască editorul.
  const onChangeRef = useRef(onChange)
  const uploadRef = useRef(onImageUpload)
  const editorRef = useRef<Editor | null>(null)
  const mountedRef = useRef(true)
  const errorTimerRef = useRef<number | null>(null)
  /** Ultimul HTML pe care l-am trimis sau primit — oprește bucla de sincronizare. */
  const syncedHtmlRef = useRef(value)

  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    uploadRef.current = onImageUpload
  }, [onImageUpload])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current)
        errorTimerRef.current = null
      }
    }
  }, [])

  /** Eroarea de imagine dispare singură, ca să nu rămână agățată de bara de instrumente. */
  const showImageError = useCallback((message: string) => {
    setImageError(message)
    if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current)
    errorTimerRef.current = window.setTimeout(() => {
      errorTimerRef.current = null
      if (mountedRef.current) setImageError(null)
    }, 8000)
  }, [])

  /** Încarcă imaginile primite și le inserează la poziția indicată (sau la cursor). */
  const insertImageFiles = useCallback(
    async (files: File[], position: number | null) => {
      const editor = editorRef.current
      const upload = uploadRef.current
      if (!editor || !upload || files.length === 0) return

      const accepted = files.filter(isAcceptedImage)
      if (accepted.length === 0) {
        showImageError(IMAGE_RULES_MESSAGE)
        return
      }
      if (accepted.length < files.length) {
        showImageError(`Unele fișiere au fost ignorate. ${IMAGE_RULES_MESSAGE}`)
      }

      setUploading(true)
      let insertAt = position

      try {
        for (const file of accepted) {
          const url = await upload(file)
          if (!mountedRef.current) return

          const chain = editor.chain().focus()
          if (insertAt !== null) chain.setTextSelection(insertAt)
          chain.setImage({ src: url, alt: '' }).run()
          // Următoarea imagine merge după cea inserată, nu peste ea.
          insertAt = null
        }
      } catch (error) {
        if (mountedRef.current) {
          showImageError(getErrorMessage(error, 'Imaginea nu a putut fi încărcată.'))
        }
      } finally {
        if (mountedRef.current) setUploading(false)
      }
    },
    [showImageError],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        'aria-label': 'Conținutul articolului',
        role: 'textbox',
        'aria-multiline': 'true',
      },
      handleDrop: (view, event) => {
        const files = pickImageFiles(event.dataTransfer?.files)
        if (files.length === 0 || !uploadRef.current) return false

        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        void insertImageFiles(files, coords ? coords.pos : null)
        return true
      },
      handlePaste: (view, event) => {
        const files = pickImageFiles(event.clipboardData?.files)
        if (files.length === 0 || !uploadRef.current) return false

        event.preventDefault()
        void insertImageFiles(files, view.state.selection.from)
        return true
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML()
      syncedHtmlRef.current = html
      onChangeRef.current(html)
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  // Sincronizare controlată: doar când valoarea din exterior diferă real de document.
  useEffect(() => {
    if (!editor) return
    if (value === syncedHtmlRef.current) return
    if (value === editor.getHTML()) {
      syncedHtmlRef.current = value
      return
    }

    syncedHtmlRef.current = value
    editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const toolbar = useEditorState({
    editor,
    // Selectorul mai poate fi apelat pentru o instanță absentă, nemontată sau deja
    // distrusă (dublul montaj din StrictMode combinat cu ruta lazy): `destroy()` pune
    // `commandManager` pe null, iar `instance.can()` aruncă atunci în interiorul TipTap.
    // Fără această verificare, pagina editorului rămânea complet albă la un F5 pe
    // /management/articole/nou. Bara se randează doar pentru un editor viu și montat.
    selector: ({ editor: instance }): ToolbarState | null =>
      !instance || instance.isDestroyed || !instance.view ? null : ({
      isEmpty: instance.isEmpty,
      bold: instance.isActive('bold'),
      italic: instance.isActive('italic'),
      underline: instance.isActive('underline'),
      heading2: instance.isActive('heading', { level: 2 }),
      heading3: instance.isActive('heading', { level: 3 }),
      bulletList: instance.isActive('bulletList'),
      orderedList: instance.isActive('orderedList'),
      blockquote: instance.isActive('blockquote'),
      link: instance.isActive('link'),
      alignLeft: instance.isActive({ textAlign: 'left' }),
      alignCenter: instance.isActive({ textAlign: 'center' }),
      alignRight: instance.isActive({ textAlign: 'right' }),
      canBold: instance.can().toggleBold(),
      canItalic: instance.can().toggleItalic(),
      canUnderline: instance.can().toggleUnderline(),
      canHeading: instance.can().toggleHeading({ level: 2 }),
      canBulletList: instance.can().toggleBulletList(),
      canOrderedList: instance.can().toggleOrderedList(),
      canBlockquote: instance.can().toggleBlockquote(),
      canAlign: instance.can().setTextAlign('left'),
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
    }),
  })

  const openLinkDialog = () => {
    if (!editor) return
    const attributes = editor.getAttributes('link')
    setLinkUrl(typeof attributes.href === 'string' ? attributes.href : '')
    setLinkDialogOpen(true)
  }

  const applyLink = () => {
    if (!editor) return
    const href = normalizeUrl(linkUrl)

    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href, target: '_blank', rel: 'noopener noreferrer' })
        .run()
    }

    setLinkDialogOpen(false)
  }

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkDialogOpen(false)
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = pickImageFiles(event.target.files)
    // Resetăm valoarea, ca aceeași imagine să poată fi aleasă din nou.
    event.target.value = ''
    if (files.length > 0) void insertImageFiles(files, null)
  }

  if (!editor) {
    return (
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          minHeight,
        }}
      />
    )
  }

  // Până când ProseMirror își creează view-ul, `toolbar` este null (vezi selectorul de mai sus).
  // Bara se randează atunci în stare neutră — dar EditorContent TREBUIE randat, altfel
  // view-ul nu se creează niciodată și editorul ar rămâne blocat în starea de așteptare.
  const state = toolbar ?? EMPTY_TOOLBAR_STATE

  const canUploadImages = onImageUpload !== undefined

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          border: 1,
          borderColor: 'divider',
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          bgcolor: 'action.hover',
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: 1.5,
            px: 1.1,
            py: 0.6,
            lineHeight: 1,
            color: 'text.secondary',
            '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' },
            '&.Mui-selected:hover': { bgcolor: 'primary.dark' },
          },
        }}
        role="toolbar"
        aria-label="Formatare text"
      >
        <Tooltip title="Îngroșat (Ctrl+B)">
          <ToggleButton
            value="bold"
            size="small"
            selected={state.bold}
            disabled={!state.canBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Îngroșat"
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Cursiv (Ctrl+I)">
          <ToggleButton
            value="italic"
            size="small"
            selected={state.italic}
            disabled={!state.canItalic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Cursiv"
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Subliniat (Ctrl+U)">
          <ToggleButton
            value="underline"
            size="small"
            selected={state.underline}
            disabled={!state.canUnderline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Subliniat"
          >
            <FormatUnderlinedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <Tooltip title="Titlu de secțiune (H2)">
          <ToggleButton
            value="h2"
            size="small"
            selected={state.heading2}
            disabled={!state.canHeading}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Titlu de secțiune"
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          >
            H2
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Subtitlu (H3)">
          <ToggleButton
            value="h3"
            size="small"
            selected={state.heading3}
            disabled={!state.canHeading}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Subtitlu"
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          >
            H3
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <Tooltip title="Listă cu buline">
          <ToggleButton
            value="bulletList"
            size="small"
            selected={state.bulletList}
            disabled={!state.canBulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Listă cu buline"
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Listă numerotată">
          <ToggleButton
            value="orderedList"
            size="small"
            selected={state.orderedList}
            disabled={!state.canOrderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Listă numerotată"
          >
            <FormatListNumberedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Citat">
          <ToggleButton
            value="blockquote"
            size="small"
            selected={state.blockquote}
            disabled={!state.canBlockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Citat"
          >
            <FormatQuoteIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <Tooltip title="Link">
          <ToggleButton
            value="link"
            size="small"
            selected={state.link}
            onClick={openLinkDialog}
            aria-label="Adaugă sau editează link"
          >
            <InsertLinkIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Elimină linkul">
          <ToggleButton
            value="unlink"
            size="small"
            selected={false}
            disabled={!state.link}
            onClick={removeLink}
            aria-label="Elimină linkul"
          >
            <LinkOffIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title={canUploadImages ? 'Inserează o imagine' : 'Încărcarea imaginilor nu este disponibilă'}>
          <ToggleButton
            value="image"
            size="small"
            selected={false}
            disabled={!canUploadImages || uploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Inserează o imagine"
          >
            <ImageOutlinedIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <Tooltip title="Aliniere la stânga">
          <ToggleButton
            value="alignLeft"
            size="small"
            selected={state.alignLeft}
            disabled={!state.canAlign}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            aria-label="Aliniere la stânga"
          >
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Aliniere centrată">
          <ToggleButton
            value="alignCenter"
            size="small"
            selected={state.alignCenter}
            disabled={!state.canAlign}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            aria-label="Aliniere centrată"
          >
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Aliniere la dreapta">
          <ToggleButton
            value="alignRight"
            size="small"
            selected={state.alignRight}
            disabled={!state.canAlign}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            aria-label="Aliniere la dreapta"
          >
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        <Tooltip title="Anulează (Ctrl+Z)">
          <ToggleButton
            value="undo"
            size="small"
            selected={false}
            disabled={!state.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
            aria-label="Anulează ultima modificare"
          >
            <UndoIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Refă (Ctrl+Shift+Z)">
          <ToggleButton
            value="redo"
            size="small"
            selected={false}
            disabled={!state.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
            aria-label="Refă ultima modificare"
          >
            <RedoIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </Box>

      {uploading && <LinearProgress aria-label="Se încarcă imaginea" />}

      <Box
        sx={{
          position: 'relative',
          border: 1,
          borderColor: 'divider',
          borderRadius: '0 0 12px 12px',
          bgcolor: 'background.paper',
          transition: 'border-color .2s ease, box-shadow .2s ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
          },
          '& .ProseMirror': {
            minHeight,
            px: { xs: 2, md: 3 },
            py: 2.5,
            outline: 'none',
          },
          '& .ProseMirror img.ProseMirror-selectednode': {
            outline: (theme) => `3px solid ${theme.palette.primary.main}`,
          },
        }}
      >
        {state.isEmpty && (
          <Typography
            aria-hidden="true"
            color="text.disabled"
            sx={{
              position: 'absolute',
              top: 20,
              left: { xs: 16, md: 24 },
              pointerEvents: 'none',
              fontSize: '1.0625rem',
            }}
          >
            {placeholder}
          </Typography>
        )}

        <EditorContent editor={editor} className="article-content" />
      </Box>

      <Stack spacing={1} sx={{ mt: 1 }}>
        {imageError !== null && (
          <Alert severity="error" onClose={() => setImageError(null)}>
            {imageError}
          </Alert>
        )}
        {canUploadImages && (
          <Typography variant="caption" color="text.secondary">
            Poți trage imagini direct în text sau le poți lipi din clipboard. {IMAGE_RULES_MESSAGE}
          </Typography>
        )}
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Link</DialogTitle>
        <DialogContent>
          <TextField
            label="Adresă"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://exemplu.ro/pagina"
            helperText="Lasă câmpul gol pentru a elimina linkul."
            autoFocus
            sx={{ mt: 1 }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={removeLink} color="inherit" startIcon={<LinkOffIcon fontSize="small" />}>
            Elimină linkul
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setLinkDialogOpen(false)} color="inherit">
            Anulează
          </Button>
          <Button onClick={applyLink} variant="contained">
            Aplică
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
