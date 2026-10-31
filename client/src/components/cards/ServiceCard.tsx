import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import FavoriteIcon from '@mui/icons-material/Favorite'
import GroupsIcon from '@mui/icons-material/Groups'
import VerifiedIcon from '@mui/icons-material/Verified'
import PsychologyIcon from '@mui/icons-material/Psychology'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement'
import VideocamIcon from '@mui/icons-material/Videocam'

import { formatPriceRo } from '../common/formatters'
import { sessionModeLabels } from '../../api/types'
import type { ServiceListItemDto } from '../../api/types'

interface ServiceCardProps {
  service: ServiceListItemDto
  /** Poziția în grilă: fiecare card primește una dintre cele patru lumini ale temei (--c1…--c4). */
  index?: number
}

/**
 * Mapare explicită nume → iconiță. Importurile sunt statice (fără import dinamic
 * din `@mui/icons-material`), ca să nu ajungă tot pachetul de iconițe în bundle.
 */
const iconMap: Record<string, typeof PsychologyIcon> = {
  Psychology: PsychologyIcon,
  Favorite: FavoriteIcon,
  ChildCare: ChildCareIcon,
  Videocam: VideocamIcon,
  Assignment: AssignmentIcon,
  SelfImprovement: SelfImprovementIcon,
  Groups: GroupsIcon,
  FactCheck: FactCheckIcon,
  Verified: VerifiedIcon,
}

const clampLines = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  }) as const

export default function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  const Icon = (service.iconName && iconMap[service.iconName]) || PsychologyIcon
  const price = formatPriceRo(service.price)

  return (
    // --accent colorează iconița, inelul de sub cursor și haloul la hover (theme.ts).
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '--accent': `var(--c${(index % 4) + 1})` }}>
      <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, md: 3 } }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'color-mix(in oklab, var(--accent) 20%, transparent)',
            border: '1px solid color-mix(in oklab, var(--accent) 45%, transparent)',
            mb: 2,
          }}
        >
          {/* Amestecat cu culoarea textului, ca și luminile pale să rămână vizibile pe fundal deschis. */}
          <Icon sx={{ fontSize: 27, color: 'color-mix(in oklab, var(--accent) 65%, var(--text))' }} />
        </Box>

        <Typography variant="h4" component="h3" sx={{ color: 'text.primary' }}>
          {service.name}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ ...clampLines(3), mt: 1.5 }}>
          {service.shortDescription}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap', rowGap: 1 }}>
          <Chip size="small" variant="outlined" label={sessionModeLabels[service.sessionMode]} />
          <Chip
            size="small"
            variant="outlined"
            icon={<ScheduleRoundedIcon />}
            label={`${service.durationMinutes} min`}
          />
        </Stack>

        {price && (
          <Typography sx={{ mt: 2.5, fontWeight: 600, color: 'text.primary' }}>
            {price}
            {service.priceUnit && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.75 }}>
                {service.priceUnit}
              </Typography>
            )}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5, pt: 0 }}>
        <Button
          component={RouterLink}
          to={`/servicii/${service.slug}`}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ px: 0, '&:hover': { backgroundColor: 'transparent' } }}
        >
          Detalii
        </Button>
      </CardActions>
    </Card>
  )
}
