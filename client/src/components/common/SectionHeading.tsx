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
    <Box data-reveal sx={{ textAlign: align, mb: { xs: 3, md: 4 } }}>
      {eyebrow && (
        <Typography
          component="p"
          className="eyebrow"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            mb: 1.5,
          }}
        >
          {eyebrow}
        </Typography>
      )}

      <Typography variant={component} component={component} className="shine-text">
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
