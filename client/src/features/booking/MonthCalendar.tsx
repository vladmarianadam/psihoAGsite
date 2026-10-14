import { Box, Button, IconButton, LinearProgress, Stack, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { toIsoDate } from './dates'

const weekDays = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']

const monthFormatter = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })
const dayLabelFormatter = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })

interface MonthCalendarProps {
  /** Prima zi a lunii afișate. */
  month: Date
  canGoBack: boolean
  canGoForward: boolean
  /** Zilele ("yyyy-MM-dd") care au cel puțin un slot liber. */
  availableDates: Set<string>
  selectedDate: string | null
  loading: boolean
  onMonthChange: (delta: number) => void
  onSelect: (date: string) => void
}

export default function MonthCalendar({
  month,
  canGoBack,
  canGoForward,
  availableDates,
  selectedDate,
  loading,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // getDay(): 0 = duminică; săptămâna din calendar începe luni.
  const leadingBlanks = (month.getDay() + 6) % 7

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <IconButton aria-label="Luna anterioară" disabled={!canGoBack || loading} onClick={() => onMonthChange(-1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" component="p" aria-live="polite" sx={{ textTransform: 'capitalize' }}>
          {monthFormatter.format(month)}
        </Typography>
        <IconButton aria-label="Luna următoare" disabled={!canGoForward || loading} onClick={() => onMonthChange(1)}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      <Box sx={{ height: 4, mb: 1 }}>{loading && <LinearProgress aria-label="Se încarcă zilele libere" />}</Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.75 }}>
        {weekDays.map((day) => (
          <Typography
            key={day}
            variant="caption"
            aria-hidden="true"
            sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary' }}
          >
            {day}
          </Typography>
        ))}

        {Array.from({ length: leadingBlanks }).map((_, index) => (
          <Box key={`blank-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const date = new Date(year, monthIndex, index + 1)
          const iso = toIsoDate(date)
          const available = !loading && availableDates.has(iso)
          const isSelected = iso === selectedDate

          return (
            <Button
              key={iso}
              variant={isSelected ? 'contained' : available ? 'outlined' : 'text'}
              disabled={!available}
              aria-pressed={isSelected}
              aria-label={`${dayLabelFormatter.format(date)}${available ? '' : ', indisponibil'}`}
              onClick={() => onSelect(iso)}
              sx={{ minWidth: 0, aspectRatio: '1', p: 0, borderRadius: 2, fontWeight: available ? 700 : 400 }}
            >
              {index + 1}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}
