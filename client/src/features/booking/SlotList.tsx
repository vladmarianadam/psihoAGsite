import { Box, Button, Stack, Typography } from '@mui/material'
import PublicIcon from '@mui/icons-material/Public'

import type { BookingSlotDto } from '../../api/types'

const groups = [
  { label: 'Dimineața', test: (hour: number) => hour < 12 },
  { label: 'După-amiaza', test: (hour: number) => hour >= 12 && hour < 17 },
  { label: 'Seara', test: (hour: number) => hour >= 17 },
]

interface SlotListProps {
  slots: BookingSlotDto[]
  /** Eticheta zilei, ex. „marți, 14 octombrie”. */
  dayLabel: string
  onSelect: (slot: BookingSlotDto) => void
}

export default function SlotList({ slots, dayLabel, onSelect }: SlotListProps) {
  return (
    <Stack spacing={2.5}>
      {slots.length === 0 && (
        <Typography color="text.secondary">Nu mai sunt ore libere în această zi. Alege altă zi.</Typography>
      )}

      {groups.map((group) => {
        // localTime e "HH:mm" în ora României, deci ora se citește direct din text.
        const items = slots.filter((slot) => group.test(Number(slot.localTime.slice(0, 2))))
        if (items.length === 0) return null

        return (
          <Box key={group.label} role="group" aria-label={group.label}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              {group.label}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 1 }}>
              {items.map((slot) => (
                <Button
                  key={slot.startAt}
                  variant="outlined"
                  aria-label={`${dayLabel}, ora ${slot.localTime}`}
                  onClick={() => onSelect(slot)}
                >
                  {slot.localTime}
                </Button>
              ))}
            </Box>
          </Box>
        )
      })}

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
        <PublicIcon fontSize="small" />
        <Typography variant="caption">Ora României (Europe/Bucharest)</Typography>
      </Stack>
    </Stack>
  )
}
