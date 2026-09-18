import { useState } from 'react'
import { Box, Button, Snackbar, Stack, Typography } from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'

interface ShareButtonsProps {
  title: string
  url: string
}

/** Verificare o singură dată: pe conexiuni nesecurizate `navigator.clipboard` lipsește. */
function clipboardAvailable(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [canCopy] = useState(clipboardAvailable)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`${title} ${url}`)

  const targets = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon />,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <LinkedInIcon />,
    },
    {
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}`,
      icon: <WhatsAppIcon />,
    },
  ]

  const handleCopy = async () => {
    if (!clipboardAvailable()) return

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Fallback silențios: dacă browserul refuză accesul la clipboard, nu deranjăm cititorul.
    }
  }

  return (
    <Box>
      <Typography
        component="p"
        sx={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'secondary.dark',
          mb: 1.5,
        }}
      >
        Distribuie articolul
      </Typography>

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {targets.map((target) => (
          <Button
            key={target.label}
            component="a"
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            color="primary"
            startIcon={target.icon}
            aria-label={`Distribuie pe ${target.label}`}
          >
            {target.label}
          </Button>
        ))}

        {canCopy && (
          <Button
            type="button"
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<ContentCopyRoundedIcon />}
            onClick={handleCopy}
          >
            Copiază linkul
          </Button>
        )}
      </Stack>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message="Linkul a fost copiat."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
