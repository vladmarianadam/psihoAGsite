import { Box, Card, CardContent, Rating, Typography } from '@mui/material'

import type { TestimonialDto } from '../../api/types'

interface TestimonialCardProps {
  testimonial: TestimonialDto
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent
        sx={{
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2.5, md: 3 },
        }}
      >
        {/* Ghilimele decorative, ascunse pentru cititoarele de ecran. */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: { xs: 4, md: 8 },
            right: 18,
            fontFamily: 'Georgia, serif',
            fontSize: '5rem',
            lineHeight: 1,
            color: 'secondary.main',
            opacity: 0.28,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          &bdquo;
        </Box>

        <Typography
          component="blockquote"
          sx={{
            position: 'relative',
            m: 0,
            fontStyle: 'italic',
            color: 'text.primary',
            pr: { xs: 4, md: 5 },
          }}
        >
          &bdquo;{testimonial.text}&rdquo;
        </Typography>

        <Box sx={{ mt: 'auto', pt: 2.5 }}>
          {testimonial.rating > 0 && (
            <Rating
              value={testimonial.rating}
              readOnly
              size="small"
              sx={{ mb: 1, color: 'secondary.dark' }}
            />
          )}

          <Typography component="p" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {testimonial.authorName}
          </Typography>

          {testimonial.authorRole && (
            <Typography variant="body2" color="text.secondary">
              {testimonial.authorRole}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
