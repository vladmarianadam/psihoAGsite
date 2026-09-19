import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Stack, Typography } from '@mui/material'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'

import { phoneHref, site } from '../../config/site'

interface CtaBannerProps {
  title?: string
  description?: string
  primaryLabel?: string
  primaryTo?: string
  showPhone?: boolean
}

export default function CtaBanner({
  title = 'Primul pas poate fi o simplă conversație',
  description = 'Scrie-mi câteva rânduri despre ceea ce te aduce aici. Îți răspund în cel mai scurt timp și stabilim împreună un moment potrivit pentru prima ședință, în cabinet sau online.',
  primaryLabel = 'Programează o ședință',
  primaryTo = '/contact',
  showPhone = true,
}: CtaBannerProps) {
  return (
    <Box
      sx={({ palette: { brand } }) => ({
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        px: { xs: 3, sm: 5, md: 7 },
        py: { xs: 5, md: 7 },
        color: 'common.white',
        // Gradient decorativ din paleta temei active.
        backgroundColor: brand.primary,
        backgroundImage: [
          `radial-gradient(90% 130% at 100% 0%, ${brand.secondaryDark}59 0%, transparent 58%)`,
          `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
        ].join(', '),
      })}
    >
      <Box sx={{ position: 'relative', maxWidth: '62ch' }}>
        <Typography variant="h3" component="h2" sx={{ color: 'inherit' }}>
          {title}
        </Typography>

        {description && (
          <Typography sx={{ mt: 2, color: 'inherit', opacity: 0.88 }}>{description}</Typography>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
          <Button
            component={RouterLink}
            to={primaryTo}
            size="large"
            variant="contained"
            color="secondary"
          >
            {primaryLabel}
          </Button>

          {showPhone && (
            <Button
              component="a"
              href={phoneHref}
              size="large"
              variant="outlined"
              startIcon={<PhoneRoundedIcon />}
              sx={{
                color: 'common.white',
                borderColor: 'rgba(255, 255, 255, 0.55)',
                '&:hover': {
                  borderColor: 'common.white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {site.phone}
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
