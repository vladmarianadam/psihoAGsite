import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

import { formatPriceRo } from '../../components/common/formatters'
import { sessionModeLabels, type ServiceListItemDto } from '../../api/types'

export type BookingMode = 'Cabinet' | 'Online'

/** Modurile permise de serviciu; `Both` înseamnă ambele. */
function allowedModes(service: ServiceListItemDto): BookingMode[] {
  return service.sessionMode === 'Both' ? ['Cabinet', 'Online'] : [service.sessionMode]
}

interface ServicePickerProps {
  services: ServiceListItemDto[]
  selected: ServiceListItemDto | null
  mode: BookingMode
  onSelect: (service: ServiceListItemDto) => void
  onModeChange: (mode: BookingMode) => void
}

export default function ServicePicker({ services, selected, mode, onSelect, onModeChange }: ServicePickerProps) {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {services.map((service) => {
          const isSelected = service.id === selected?.id
          const price = formatPriceRo(service.price)

          return (
            <Grid key={service.id} size={{ xs: 12, sm: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderWidth: 2,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                }}
              >
                <CardActionArea
                  aria-pressed={isSelected}
                  onClick={() => onSelect(service)}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Typography variant="h6" component="h3" sx={{ color: 'text.primary' }}>
                      {service.name}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1, color: 'text.secondary', flexWrap: 'wrap' }}>
                      {service.durationMinutes > 0 && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body2">{service.durationMinutes} min</Typography>
                        </Stack>
                      )}
                      {price && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {price}
                          {service.priceUnit ? ` ${service.priceUnit}` : ''}
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      {sessionModeLabels[service.sessionMode]}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {selected && (
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Cum preferi să aibă loc ședința?
          </Typography>
          <ToggleButtonGroup
            exclusive
            color="primary"
            aria-label="Modul de desfășurare a ședinței"
            value={mode}
            onChange={(_event, value: BookingMode | null) => {
              if (value) onModeChange(value)
            }}
            sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: 999, px: 2.25 } }}
          >
            {allowedModes(selected).map((option) => (
              <ToggleButton key={option} value={option} sx={{ textTransform: 'none' }}>
                {sessionModeLabels[option]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
    </Stack>
  )
}
