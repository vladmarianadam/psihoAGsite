import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Fade,
  Grid,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import DOMPurify from 'dompurify'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'

import Seo from '../components/common/Seo'
import SectionHeading from '../components/common/SectionHeading'
import PlaceholderImage from '../components/common/PlaceholderImage'
import CtaBanner from '../components/common/CtaBanner'
import ServiceCard from '../components/cards/ServiceCard'
import ArticleCard from '../components/cards/ArticleCard'
import TestimonialCard from '../components/cards/TestimonialCard'
import { formatPriceRo } from '../components/common/formatters'
import { palette } from '../theme'
import { mailHref, phoneHref, site } from '../config/site'
import { getErrorMessage } from '../api/client'
import { getServices } from '../api/services'
import { getTestimonials } from '../api/testimonials'
import { getFaq } from '../api/faq'
import { getPublishedArticles } from '../api/articles'
import type {
  ArticleListItemDto,
  FaqItemDto,
  ServiceListItemDto,
  TestimonialDto,
} from '../api/types'

// ---------------------------------------------------------------------------
// Conținut redacțional (nu vine din API) — plan §6, secțiunile 3, 5, 6 și 7.
// ---------------------------------------------------------------------------

const competencies: string[] = [
  'Anxietate generalizată și atacuri de panică',
  'Stări depresive și lipsă de energie',
  'Stres profesional și epuizare',
  'Relații de cuplu și dificultăți de comunicare',
  'Doliu, separare și alte pierderi',
  'Stimă de sine și critică interioară',
]

const benefits: string[] = [
  'Un somn mai odihnitor și mai puține nopți petrecute cu gândurile în buclă.',
  'Instrumente concrete pentru momentele de anxietate, pe care le poți folosi chiar în timpul lor.',
  'Relații mai limpezi: îți exprimi nevoile fără să te temi de fiecare conversație dificilă.',
  'Decizii luate din ceea ce contează pentru tine, nu din teamă sau din presiunea celorlalți.',
  'O imagine de sine mai așezată și un dialog interior mai puțin dur.',
  'Înțelegerea tiparelor care se repetă, ca să nu te mai surprindă de fiecare dată.',
]

const signals: string[] = [
  'Te trezești obosit chiar și după o noapte întreagă de somn, iar odihna nu mai ajută.',
  'Grijile revin în buclă și îți e greu să te concentrezi la lucru sau într-o conversație.',
  'Aceleași certuri se repetă în relație, deși amândoi vă doriți altceva.',
  'Ai trecut printr-o pierdere sau o schimbare majoră și încă nu îți găsești echilibrul.',
  'Amâni decizii importante de teamă că vei greși.',
  'Simți că nu ești suficient de bun, indiferent câte lucruri reușești.',
]

interface PackageOption {
  sessions: number
  title: string
  /** Reducerea aplicată prețului de listă, ca fracție (0.1 = 10%). */
  discount: number
  note: string
  highlighted?: boolean
}

const packageOptions: PackageOption[] = [
  {
    sessions: 1,
    title: 'O ședință',
    discount: 0,
    note: 'Potrivită pentru prima întâlnire sau pentru o temă bine delimitată, pe care vrei să o clarifici.',
  },
  {
    sessions: 5,
    title: 'Pachet 5 ședințe',
    discount: 0.05,
    note: 'Un interval în care se văd de obicei primele schimbări și putem evalua împreună direcția.',
    highlighted: true,
  },
  {
    sessions: 10,
    title: 'Pachet 10 ședințe',
    discount: 0.1,
    note: 'Pentru un proces mai amplu, cu obiective revizuite la fiecare patru sau cinci ședințe.',
  },
]

/** Corespondența dintre etichetele din `site.schedule` și codurile schema.org. */
const scheduleDayCodes: Record<string, string> = {
  'Luni – Joi': 'Mo-Th',
  Vineri: 'Fr',
  Sâmbătă: 'Sa',
  Duminică: 'Su',
}

function buildOpeningHours(): string[] {
  return site.schedule
    .map((entry) => {
      const code = scheduleDayCodes[entry.day]
      const hours = /^(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/.exec(entry.hours)
      return code && hours ? `${code} ${hours[1]}-${hours[2]}` : null
    })
    .filter((value): value is string => value !== null)
}

/** Text simplu pentru `acceptedAnswer` din FAQPage — datele structurate nu primesc HTML. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Ambalajul comun al secțiunilor: Container + spațiere generoasă + fundal
// alternativ, ca pagina să aibă ritm vizual.
// ---------------------------------------------------------------------------

type SectionTone = 'default' | 'paper' | 'tint'

interface SectionProps {
  children: ReactNode
  tone?: SectionTone
  id?: string
}

function Section({ children, tone = 'default', id }: SectionProps) {
  const background =
    tone === 'paper' ? 'background.paper' : tone === 'tint' ? `${palette.secondary}14` : 'transparent'

  return (
    <Box component="section" id={id} sx={{ py: { xs: 7, md: 11 }, bgcolor: background }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  )
}

interface CheckItemProps {
  children: ReactNode
}

/** Rând de listă cu bifă, folosit în „Despre mine” și „Rezultate”. */
function CheckItem({ children }: CheckItemProps) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <CheckCircleOutlineRoundedIcon
        aria-hidden="true"
        sx={{ fontSize: 21, mt: '3px', flexShrink: 0, color: 'secondary.dark' }}
      />
      <Typography component="span" sx={{ color: 'text.secondary' }}>
        {children}
      </Typography>
    </Stack>
  )
}

// -------------------------------------------------------------- 1. Hero ---

function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 6, md: 10 },
        pb: { xs: 7, md: 12 },
        // Gradient decorativ din paleta temei (fără imagini externe).
        backgroundImage: [
          `radial-gradient(90% 110% at 6% 0%, ${palette.secondary}2E 0%, transparent 58%)`,
          `radial-gradient(80% 100% at 100% 24%, ${palette.primaryLight}26 0%, transparent 60%)`,
        ].join(', '),
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 7 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              component="p"
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'secondary.dark',
              }}
            >
              {site.role}
            </Typography>

            <Typography variant="h1" sx={{ mt: 1.5, maxWidth: '18ch' }}>
              {site.name}
            </Typography>

            <Typography variant="h5" component="p" sx={{ mt: 2.5, color: 'text.secondary' }}>
              {site.tagline}
            </Typography>

            <Typography sx={{ mt: 3, maxWidth: '58ch', fontSize: '1.0625rem', color: 'text.secondary' }}>
              Uneori e greu de pus în cuvinte ce anume nu mai merge — știi doar că e obositor și că
              nu mai vrei să duci totul singur. Aici găsești un spațiu liniștit și confidențial, în
              care putem înțelege împreună ce se întâmplă și ce pași au sens pentru tine.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4.5 }}>
              <Button component={RouterLink} to="/contact" size="large" variant="contained">
                Solicită o programare
              </Button>
              <Button
                component="a"
                href={phoneHref}
                size="large"
                variant="outlined"
                startIcon={<PhoneRoundedIcon />}
              >
                {site.phone}
              </Button>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 24px 60px rgba(44, 54, 57, 0.10)',
              }}
            >
              <PlaceholderImage
                ratio={4 / 5}
                icon={<SelfImprovementOutlinedIcon />}
                label="Atmosfera cabinetului — fotografiile sunt în curs de pregătire"
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

// -------------------------------------------------- 2. Bara de încredere ---

function TrustBarSection() {
  const items: { icon: ReactNode; title: string; text: string }[] = [
    {
      icon: <VerifiedOutlinedIcon />,
      title: 'Acreditare profesională',
      text: site.copsi,
    },
    {
      icon: <PlaceOutlinedIcon />,
      title: `Cabinet în ${site.address.city}`,
      text: `${site.address.street}, ${site.address.city}`,
    },
    {
      icon: <ScheduleRoundedIcon />,
      title: 'Program flexibil',
      text: 'Ședințe în cabinet sau online, în intervale potrivite și după orele de birou.',
    },
  ]

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 4, md: 5 },
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {items.map((item) => (
            <Grid key={item.title} size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& svg': { fontSize: 22, color: 'primary.main' },
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography component="p" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    {item.text}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

// ------------------------------------------------------- 3. Despre Adina ---

function AboutSection() {
  return (
    <Section>
      <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center">
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <PlaceholderImage
              ratio={4 / 5}
              icon={<PsychologyOutlinedIcon />}
              label={`Portret ${site.shortName} — fotografia este în curs de pregătire`}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <SectionHeading eyebrow="Despre mine" title={`${site.shortName}, ${site.role.toLowerCase()}`} />

          <Stack spacing={2}>
            <Typography sx={{ color: 'text.secondary' }}>
              Lucrez de peste zece ani cu adulți, cupluri și adolescenți care trec prin anxietate,
              stări depresive, epuizare sau momente de cotitură în viață. Am ales această profesie
              pentru convingerea că nimeni nu ar trebui să ducă singur ce e prea greu de dus.
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Abordarea mea este integrativă, cu rădăcini în terapia cognitiv-comportamentală, dar
              adaptată fiecărei persoane. Nu vin cu rețete: pornim de la ce te aduce în cabinet,
              stabilim împreună obiective realiste și verificăm periodic dacă mergem în direcția
              bună pentru tine.
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Ședințele au loc într-un cadru clar și confidențial — durată fixă, ritm stabilit de
              comun acord, fără judecăți. Poți veni în cabinet, la {site.address.city}, sau ne
              putem vedea online, dacă îți este mai simplu.
            </Typography>
          </Stack>

          <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 2, color: 'text.primary' }}>
            Domenii de competență
          </Typography>

          <Grid container spacing={1.5}>
            {competencies.map((item) => (
              <Grid key={item} size={{ xs: 12, sm: 6 }}>
                <CheckItem>{item}</CheckItem>
              </Grid>
            ))}
          </Grid>

          <Button
            component={RouterLink}
            to="/despre"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ mt: 4, px: 0, '&:hover': { backgroundColor: 'transparent' } }}
          >
            Mai multe despre mine
          </Button>
        </Grid>
      </Grid>
    </Section>
  )
}

// ------------------------------------------------------------ 4. Servicii ---

interface ServicesSectionProps {
  services: ServiceListItemDto[]
  loading: boolean
}

function ServicesSection({ services, loading }: ServicesSectionProps) {
  const featured = [...services].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 4)

  if (!loading && featured.length === 0) return null

  return (
    <Section tone="paper" id="servicii">
      <SectionHeading
        eyebrow="Servicii"
        title="Cum putem lucra împreună"
        subtitle="Fiecare formă de sprijin pornește de la o discuție de cunoaștere, în care stabilim dacă și cum are sens să continuăm."
        align="center"
      />

      {loading ? (
        <Grid container spacing={{ xs: 2.5, md: 3 }} aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3].map((slot) => (
            <Grid key={slot} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {featured.map((service) => (
            <Grid key={service.id} size={{ xs: 12, sm: 6, lg: 3 }}>
              <ServiceCard service={service} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          component={RouterLink}
          to="/servicii"
          variant="outlined"
          endIcon={<ArrowForwardRoundedIcon />}
        >
          Toate serviciile
        </Button>
      </Box>
    </Section>
  )
}

// -------------------------------------------------- 5. Rezultate concrete ---

function BenefitsSection() {
  return (
    <Section>
      <Grid container spacing={{ xs: 4, md: 7 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionHeading
            eyebrow="Ce se schimbă"
            title="Rezultatele la care lucrăm"
            subtitle="Terapia nu promite dispariția dificultăților. Ce se schimbă, treptat, este felul în care le înțelegi și le duci."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            {benefits.map((benefit) => (
              <CheckItem key={benefit}>{benefit}</CheckItem>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Section>
  )
}

// ------------------------------------------------------------- 6. Pachete ---

interface PackagesSectionProps {
  services: ServiceListItemDto[]
}

function PackagesSection({ services }: PackagesSectionProps) {
  const reference = services
    .filter((service) => service.price !== null && service.price > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder)[0]

  // Fără preț de referință secțiunea nu are ce afișa — nu se randează deloc.
  if (!reference || reference.price === null) return null

  const unitPrice = reference.price

  return (
    <Section tone="tint">
      <SectionHeading
        eyebrow="Pachete"
        title="Opțiuni de tarifare"
        subtitle={`Prețurile pornesc de la ședința de ${reference.durationMinutes} de minute și sunt orientative. Pachetele nu se achită în avans: reducerea se aplică ședință cu ședință, iar procesul poate fi oprit oricând.`}
        align="center"
      />

      <Grid container spacing={{ xs: 2.5, md: 3 }}>
        {packageOptions.map((option) => {
          const listTotal = unitPrice * option.sessions
          // Rotunjire la 10 lei, ca prețurile afișate să rămână ușor de citit.
          const total = Math.round((listTotal * (1 - option.discount)) / 10) * 10
          const perSession = Math.round(total / option.sessions)

          return (
            <Grid key={option.sessions} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: option.highlighted ? 'primary.main' : 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    <Typography variant="h4" component="h3" sx={{ color: 'text.primary' }}>
                      {option.title}
                    </Typography>
                    {option.discount > 0 && (
                      <Chip
                        size="small"
                        color="secondary"
                        label={`Reducere ${Math.round(option.discount * 100)}%`}
                      />
                    )}
                  </Stack>

                  <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'baseline', gap: 1.25, flexWrap: 'wrap' }}>
                    <Typography component="p" sx={{ fontSize: '1.75rem', fontWeight: 600, color: 'text.primary' }}>
                      {formatPriceRo(total) ?? ''}
                    </Typography>
                    {option.discount > 0 && (
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ color: 'text.secondary', textDecoration: 'line-through' }}
                      >
                        {formatPriceRo(listTotal) ?? ''}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
                    {option.sessions === 1
                      ? `pentru o ședință de ${reference.durationMinutes} de minute`
                      : `${formatPriceRo(perSession) ?? ''} pe ședință`}
                  </Typography>

                  <Divider sx={{ my: 2.5 }} />

                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {option.note}
                  </Typography>

                  <Box sx={{ mt: 'auto', pt: 3 }}>
                    <Button
                      component={RouterLink}
                      to="/contact"
                      fullWidth
                      variant={option.highlighted ? 'contained' : 'outlined'}
                    >
                      Solicită o programare
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
        Tarifele complete, pe fiecare serviciu, se găsesc în{' '}
        <Link component={RouterLink} to="/servicii" sx={{ color: 'primary.main' }}>
          pagina de servicii
        </Link>
        .
      </Typography>
    </Section>
  )
}

// -------------------------------------- 7. „Ai nevoie de un psiholog?” ---

function WhenToAskSection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Când ajută terapia"
        title="Ai nevoie de un psiholog?"
        subtitle="Nu există un prag de suferință de la care ai „dreptul” să ceri ajutor. Dacă recunoști câteva dintre situațiile de mai jos, o discuție poate fi un început bun."
        align="center"
      />

      <Grid container spacing={{ xs: 2.5, md: 3 }}>
        {signals.map((signal) => (
          <Grid key={signal} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Box
              sx={{
                height: '100%',
                p: { xs: 2.5, md: 3 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography sx={{ color: 'text.secondary' }}>{signal}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" sx={{ mt: 4, textAlign: 'center', color: 'text.secondary', maxWidth: '70ch', mx: 'auto' }}>
        Niciuna dintre situațiile de mai sus nu înseamnă un diagnostic. Dacă însă te confrunți cu
        gânduri de a-ți face rău, te rog să apelezi imediat 112 sau să mergi la cea mai apropiată
        unitate de primiri urgențe — acolo poți primi ajutor pe loc.
      </Typography>
    </Section>
  )
}

// ------------------------------------------------------- 8. Testimoniale ---

interface TestimonialsSectionProps {
  items: TestimonialDto[]
  loading: boolean
}

function TestimonialsSection({ items, loading }: TestimonialsSectionProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [page, setPage] = useState(0)

  const perView = isDesktop ? 2 : 1
  const pageCount = Math.max(1, Math.ceil(items.length / perView))
  const current = Math.min(page, pageCount - 1)
  const visible = items.slice(current * perView, current * perView + perView)

  if (loading) {
    return (
      <Section tone="paper">
        <SectionHeading eyebrow="Testimoniale" title="Experiențe împărtășite" align="center" />
        <Grid container spacing={{ xs: 2.5, md: 3 }} aria-busy="true" aria-live="polite">
          {[0, 1].map((slot) => (
            <Grid key={slot} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={230} />
            </Grid>
          ))}
        </Grid>
      </Section>
    )
  }

  // Secțiunea dispare complet dacă nu există testimoniale aprobate.
  if (items.length === 0) return null

  const goTo = (next: number) => setPage((next + pageCount) % pageCount)

  return (
    <Section tone="paper">
      <SectionHeading
        eyebrow="Testimoniale"
        title="Experiențe împărtășite"
        subtitle="Mărturii publicate cu acordul persoanelor implicate, cu numele prescurtate pentru păstrarea confidențialității."
        align="center"
      />

      <Box sx={{ position: 'relative' }}>
        <Fade in key={current} timeout={450}>
          <Box>
            <Grid container spacing={{ xs: 2.5, md: 3 }}>
              {visible.map((testimonial) => (
                <Grid key={testimonial.id} size={{ xs: 12, md: perView === 2 ? 6 : 12 }}>
                  <TestimonialCard testimonial={testimonial} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Box>

      {pageCount > 1 && (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mt: 4 }}>
          <IconButton
            aria-label="Testimonialele anterioare"
            onClick={() => goTo(current - 1)}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>

          <Stack direction="row" spacing={1} alignItems="center">
            {Array.from({ length: pageCount }, (_, index) => (
              <ButtonBase
                key={index}
                onClick={() => setPage(index)}
                aria-label={`Afișează grupul ${index + 1} din ${pageCount} de testimoniale`}
                aria-current={index === current}
                sx={{
                  width: index === current ? 26 : 9,
                  height: 9,
                  borderRadius: 999,
                  bgcolor: index === current ? 'primary.main' : 'divider',
                  transition: 'width .25s ease, background-color .25s ease',
                }}
              />
            ))}
          </Stack>

          <IconButton
            aria-label="Testimonialele următoare"
            onClick={() => goTo(current + 1)}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
      )}
    </Section>
  )
}

// ----------------------------------------------------------------- 9. FAQ ---

interface FaqSectionProps {
  items: FaqItemDto[]
  loading: boolean
}

function FaqSection({ items, loading }: FaqSectionProps) {
  const [expanded, setExpanded] = useState<number | false>(false)

  if (loading) {
    return (
      <Section id="intrebari-frecvente">
        <SectionHeading eyebrow="Întrebări frecvente" title="Ce vrei să știi înainte de prima ședință" align="center" />
        <Box sx={{ maxWidth: 860, mx: 'auto' }} aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3].map((slot) => (
            <Skeleton key={slot} variant="rounded" height={62} sx={{ mb: 1.5 }} />
          ))}
        </Box>
      </Section>
    )
  }

  if (items.length === 0) return null

  return (
    <Section id="intrebari-frecvente">
      <SectionHeading
        eyebrow="Întrebări frecvente"
        title="Ce vrei să știi înainte de prima ședință"
        subtitle="Dacă nu găsești răspunsul aici, scrie-mi și îți răspund personal."
        align="center"
      />

      <Box sx={{ maxWidth: 860, mx: 'auto' }}>
        {items.map((item) => (
          <Accordion
            key={item.id}
            expanded={expanded === item.id}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? item.id : false)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreRoundedIcon />}
              aria-controls={`faq-panel-${item.id}`}
              id={`faq-header-${item.id}`}
              sx={{ px: { xs: 2, md: 2.5 }, py: 0.5 }}
            >
              <Typography component="h3" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {item.question}
              </Typography>
            </AccordionSummary>

            <AccordionDetails id={`faq-panel-${item.id}`} sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5, pt: 0 }}>
              <Box
                className="article-content"
                sx={{ '& p:last-child': { mb: 0 } }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answerHtml) }}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Section>
  )
}

// ------------------------------------------------- 10. Ultimele articole ---

interface ArticlesSectionProps {
  articles: ArticleListItemDto[]
  loading: boolean
}

function ArticlesSection({ articles, loading }: ArticlesSectionProps) {
  if (!loading && articles.length === 0) return null

  return (
    <Section tone="paper">
      <SectionHeading
        eyebrow="Din blog"
        title="Ultimele articole"
        subtitle="Texte scrise pentru cei care vor să înțeleagă mai bine ce li se întâmplă. Informarea nu înlocuiește o ședință, dar poate fi un prim pas."
        align="center"
      />

      {loading ? (
        <Grid container spacing={{ xs: 2.5, md: 3 }} aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((slot) => (
            <Grid key={slot} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={340} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {articles.map((article) => (
            <Grid key={article.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button component={RouterLink} to="/blog" variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
          Vezi toate articolele
        </Button>
      </Box>
    </Section>
  )
}

// ------------------------------------------- 11. CTA final + program ---

function ClosingSection() {
  return (
    <Section tone="tint">
      <CtaBanner />

      <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: { xs: 4, md: 5 } }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box
            sx={{
              height: '100%',
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" component="h3" sx={{ color: 'text.primary' }}>
              Programul cabinetului
            </Typography>

            <Stack sx={{ mt: 2 }} divider={<Divider flexItem />}>
              {site.schedule.map((entry) => (
                <Box
                  key={entry.day}
                  sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.25 }}
                >
                  <Typography component="span" sx={{ color: 'text.primary' }}>
                    {entry.day}
                  </Typography>
                  <Typography component="span" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                    {entry.hours}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Ședințele se stabilesc din timp, pe intervale fixe. Dacă nu găsești un moment potrivit
              în program, scrie-mi și căutăm o soluție.
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              height: '100%',
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" component="h3" sx={{ color: 'text.primary' }}>
              Contact direct
            </Typography>

            <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
              Telefonic, în intervalul de program. Dacă nu răspund, sunt cel mai probabil într-o
              ședință — revin cu un apel imediat ce se încheie.
            </Typography>

            <Stack spacing={1.5} sx={{ mt: 'auto', pt: 3 }}>
              <Button
                component="a"
                href={phoneHref}
                variant="contained"
                fullWidth
                startIcon={<PhoneRoundedIcon />}
              >
                {site.phone}
              </Button>
              <Button component="a" href={mailHref} variant="outlined" fullWidth>
                {site.email}
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

interface HomeData {
  services: ServiceListItemDto[]
  testimonials: TestimonialDto[]
  faq: FaqItemDto[]
  articles: ArticleListItemDto[]
}

const emptyData: HomeData = { services: [], testimonials: [], faq: [], articles: [] }

export default function HomePage() {
  const [data, setData] = useState<HomeData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Fiecare apel își înghite propria eroare: o secțiune fără date se ascunde,
    // dar nu blochează restul paginii.
    const failures: string[] = []
    const guard = <T,>(promise: Promise<T>, fallback: T): Promise<T> =>
      promise.catch((err: unknown) => {
        failures.push(getErrorMessage(err))
        return fallback
      })

    Promise.all([
      guard(getServices(), [] as ServiceListItemDto[]),
      guard(getTestimonials(), [] as TestimonialDto[]),
      guard(getFaq(), [] as FaqItemDto[]),
      guard(
        getPublishedArticles({ page: 1, pageSize: 3 }).then((result) => result.items),
        [] as ArticleListItemDto[],
      ),
    ]).then(([services, testimonials, faq, articles]) => {
      if (cancelled) return

      setData({ services, testimonials, faq, articles })
      // Alertă doar când nimic nu s-a încărcat (API indisponibil).
      setError(failures.length === 4 ? failures[0] : null)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const jsonLd = useMemo<Record<string, unknown>[]>(() => {
    const blocks: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Psychologist',
        '@id': `${site.url}/#cabinet`,
        name: site.name,
        description: site.description,
        url: site.url,
        telephone: site.phone,
        email: site.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.address.street,
          addressLocality: site.address.city,
          addressCountry: 'RO',
        },
        areaServed: site.address.city,
        availableLanguage: 'ro',
        openingHours: buildOpeningHours(),
      },
    ]

    if (data.faq.length > 0) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: htmlToPlainText(item.answerHtml),
          },
        })),
      })
    }

    return blocks
  }, [data.faq])

  return (
    <>
      <Seo
        title={site.name}
        description={`${site.description} ${site.tagline}, în ${site.address.city}.`}
        path="/"
        jsonLd={jsonLd}
      />

      <HeroSection />
      <TrustBarSection />

      {error && (
        <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 5 } }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      )}

      <AboutSection />
      <ServicesSection services={data.services} loading={loading} />
      <BenefitsSection />
      <PackagesSection services={data.services} />
      <WhenToAskSection />
      <TestimonialsSection items={data.testimonials} loading={loading} />
      <FaqSection items={data.faq} loading={loading} />
      <ArticlesSection articles={data.articles} loading={loading} />
      <ClosingSection />
    </>
  )
}
