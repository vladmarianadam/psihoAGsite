import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Container, Paper, Skeleton, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

import Seo from '../components/common/Seo'
import SectionHeading from '../components/common/SectionHeading'
import AppointmentForm from '../features/appointment/AppointmentForm'
import ServicePicker, { type BookingMode } from '../features/booking/ServicePicker'
import MonthCalendar from '../features/booking/MonthCalendar'
import SlotList from '../features/booking/SlotList'
import DetailsForm from '../features/booking/DetailsForm'
import { fromIsoDate, toIsoDate } from '../features/booking/dates'
import { getBookingSlots } from '../api/booking'
import { getServices } from '../api/services'
import { getErrorMessage } from '../api/client'
import { sessionModeLabels, type BookingSlotDto, type BookingSlotsDto, type ServiceListItemDto } from '../api/types'

const dayLabelFormatter = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })

function firstOfMonth(date: Date, offset = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" component="section" sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2.5, color: 'text.primary' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  )
}

export default function BookingPage() {
  const [searchParams] = useSearchParams()
  const today = toIsoDate(new Date())

  const [services, setServices] = useState<ServiceListItemDto[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [service, setService] = useState<ServiceListItemDto | null>(null)
  const [mode, setMode] = useState<BookingMode>('Cabinet')
  const [month, setMonth] = useState(() => firstOfMonth(new Date()))
  const [slotsData, setSlotsData] = useState<BookingSlotsDto | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  // Crește după un 409, ca să recerem luna curentă.
  const [reloadKey, setReloadKey] = useState(0)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotDto | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const selectService = (next: ServiceListItemDto) => {
    setService(next)
    setMode(next.sessionMode === 'Online' ? 'Online' : 'Cabinet')
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  useEffect(() => {
    let cancelled = false

    getServices()
      .then((items) => {
        if (cancelled) return
        setServices(items)
        // Preselecția din pagina unui serviciu: /programare?service=<id>.
        const preselected = items.find((item) => item.id === Number(searchParams.get('service')))
        if (preselected) selectService(preselected)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Nu am putut încărca serviciile.'))
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false)
      })

    return () => {
      cancelled = true
    }
    // Doar la montare; parametrul din URL contează numai pentru preselecția inițială.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const serviceId = service?.id

  useEffect(() => {
    if (serviceId == null) return

    let cancelled = false
    const firstDay = toIsoDate(month)
    const lastDay = toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0))

    setSlotsLoading(true)
    getBookingSlots(firstDay < today ? today : firstDay, lastDay, serviceId)
      .then((data) => {
        if (!cancelled) setSlotsData(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Nu am putut încărca orele libere.'))
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [serviceId, month, today, reloadKey])

  const slotsByDate = useMemo(
    () => new Map((slotsData?.days ?? []).filter((day) => day.slots.length > 0).map((day) => [day.date, day.slots])),
    [slotsData],
  )

  const changeMonth = (delta: number) => {
    setMonth((current) => firstOfMonth(current, delta))
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleConflict = (message: string) => {
    setConflict(message)
    setSelectedSlot(null)
    setReloadKey((key) => key + 1)
  }

  const dayLabel = selectedDate ? dayLabelFormatter.format(fromIsoDate(selectedDate)) : ''
  const summary =
    service && selectedSlot
      ? `${service.name} · ${sessionModeLabels[mode]} · ${dayLabel}, ora ${selectedSlot.localTime}`
      : ''

  let content: ReactNode

  if (done) {
    content = (
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={2.5} alignItems="flex-start" role="status" aria-live="polite">
          <CheckCircleOutlineIcon sx={{ fontSize: 52, color: 'primary.main' }} />
          <Typography variant="h4" component="p" sx={{ color: 'text.primary' }}>
            Cererea ta a fost trimisă. Primești confirmarea pe email după ce este aprobată.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {summary}
          </Typography>
        </Stack>
      </Paper>
    )
  } else if (slotsData?.isEnabled === false) {
    content = (
      <Stack spacing={3}>
        <Alert severity="info">
          Programarea online este momentan întreruptă. Trimite-ne o cerere mai jos și revenim cu o
          propunere de zi și oră.
        </Alert>
        <AppointmentForm services={services} defaultServiceId={service?.id ?? null} />
      </Stack>
    )
  } else {
    const slots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : []

    content = (
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Step title="1. Alege serviciul">
          {servicesLoading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <ServicePicker
              services={services}
              selected={service}
              mode={mode}
              onSelect={selectService}
              onModeChange={setMode}
            />
          )}
        </Step>

        {service && (
          <Step title="2. Alege ziua">
            <MonthCalendar
              month={month}
              canGoBack={month > firstOfMonth(new Date())}
              canGoForward={Boolean(slotsData) && toIsoDate(firstOfMonth(month, 1)) <= (slotsData?.lastBookableDate ?? '')}
              availableDates={new Set(slotsByDate.keys())}
              selectedDate={selectedDate}
              loading={slotsLoading}
              onMonthChange={changeMonth}
              onSelect={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
                setConflict(null)
              }}
            />
            {!slotsLoading && slotsData && slotsByDate.size === 0 && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Nu mai sunt ore libere în această lună. Încearcă luna următoare.
              </Typography>
            )}
          </Step>
        )}

        {service && selectedDate && !selectedSlot && (
          <Step title="3. Alege ora">
            {conflict && (
              <Alert severity="warning" sx={{ mb: 2.5 }} onClose={() => setConflict(null)}>
                {conflict}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', textTransform: 'capitalize' }}>
              {dayLabel}
            </Typography>
            <SlotList slots={slots} dayLabel={dayLabel} onSelect={setSelectedSlot} />
          </Step>
        )}

        {service && selectedSlot && (
          <Step title="4. Datele tale">
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{summary}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Ora României (Europe/Bucharest)
                </Typography>
              </Box>
              <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedSlot(null)}>
                Alege altă oră
              </Button>
            </Stack>

            <DetailsForm
              serviceId={service.id}
              mode={mode}
              slot={selectedSlot}
              onSuccess={() => setDone(true)}
              onConflict={handleConflict}
            />
          </Step>
        )}
      </Stack>
    )
  }

  return (
    <>
      <Seo
        title="Programare online"
        description="Alege serviciul, ziua și ora potrivite și trimite cererea de programare la Cabinetul Psihologic Adina Gghita, în cabinet sau online."
        path="/programare"
      />

      <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
        <SectionHeading
          component="h1"
          eyebrow="Programare online"
          title="Alege o oră potrivită"
          subtitle="Vezi orele libere și alege-o pe cea care ți se potrivește. Programarea devine fermă după ce o confirm, iar confirmarea o primești pe email."
        />
        {content}
      </Container>
    </>
  )
}
