import { Box, Typography } from '@mui/material'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  component?: 'h1' | 'h2' | 'h3'
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  component = 'h2',
}: SectionHeadingProps) {
  const centered = align === 'center'

  return (
    <Box sx={{ textAlign: align, mb: { xs: 3, md: 4 } }}>
      {eyebrow && (
        <Typography
          component="p"
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'secondary.dark',
            mb: 1.25,
          }}
        >
          {eyebrow}
        </Typography>
      )}

      <Typography variant={component} component={component} sx={{ color: 'text.primary' }}>
        {title}
      </Typography>

      {subtitle && (
        <Typography
          variant="subtitle1"
          component="p"
          sx={{
            mt: 2,
            maxWidth: '62ch',
            mx: centered ? 'auto' : 0,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}
