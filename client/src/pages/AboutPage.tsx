import type { ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined'
import FacebookIcon from '@mui/icons-material/Facebook'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

import CtaBanner from '../components/common/CtaBanner'
import PhotoImage from '../components/common/PhotoImage'
import PlaceholderImage from '../components/common/PlaceholderImage'
import portretAdina from '../assets/adina-gghita-portret.jpg'
import SectionHeading from '../components/common/SectionHeading'
import Seo from '../components/common/Seo'
import { site } from '../config/site'

/**
 * Atestatele și studiile reale, conform documentelor furnizate de client.
 * TODO (plan §11): completează anii de absolvire și codul de atestat COPSI din
 * `src/config/site.ts` când clientul trimite copiile diplomelor.
 * (Intenționat fără Alert vizibil în pagină — nota rămâne doar în cod.)
 */
const trainings: ReadonlyArray<{ title: string; detail: string }> = [
  {
    title: 'Atestat în psihologie clinică',
    detail: 'Eliberat de Colegiul Psihologilor din România.',
  },
  {
    title: 'Atestat în psihoterapie cognitiv-comportamentală individuală și de grup',
    detail: 'Eliberat de Colegiul Psihologilor din România.',
  },
  {
    title: 'Atestat în psihologie aplicată în domeniul securității naționale',
    detail: 'Eliberat de Colegiul Psihologilor din România.',
  },
  {
    title: 'Licență în Psihologie',
    detail:
      'Facultatea de Psihologie și Științele Educației, Universitatea din București.',
  },
  {
    title:
      'Master în Psihologia Sănătății — Cercetare Clinică și Optimizare Comportamentală',
    detail:
      'Facultatea de Psihologie și Științele Educației, Universitatea din București.',
  },
  {
    title: 'Master în Psihologie Aplicată în Domeniul Securității Naționale',
    detail:
      'Facultatea de Psihologie și Științele Educației, Universitatea din București.',
  },
]

const approaches: ReadonlyArray<{ icon: ReactNode; title: string; description: string }> = [
  {
    icon: <PsychologyOutlinedIcon />,
    title: 'Cognitiv-comportamentală',
    description:
      'Lucrăm împreună cu gândurile care se repetă și cu comportamentele care întrețin disconfortul. Îți propun exerciții concrete, verificabile între ședințe, astfel încât schimbarea să fie observabilă și în viața de zi cu zi, nu doar în cabinet.',
  },
  {
    icon: <VolunteerActivismOutlinedIcon />,
    title: 'Centrată pe persoană',
    description:
      'Ritmul îl stabilești tu. Rolul meu este să ofer un spațiu atent și fără judecată, în care să poți spune lucrurile așa cum sunt. Din experiența mea, ascultarea reală face adesea mai mult decât orice tehnică aplicată prea repede.',
  },
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: 'Individual și în grup',
    description:
      'Sunt atestată atât pentru psihoterapie individuală, cât și pentru lucrul în grup. Unele teme — anxietatea socială, stima de sine, abilitățile de relaționare — avansează mai repede într-un grup mic, unde vezi că nu ești singurul care trece prin asta. Alegem împreună formatul care ți se potrivește.',
  },
]

const officeGallery: ReadonlyArray<{ icon: ReactNode; label: string; caption: string }> = [
  {
    icon: <ChairOutlinedIcon />,
    label: 'Spațiul de ședințe din cabinet',
    caption: 'Spațiul de ședințe — lumină naturală, fotolii confortabile, liniște.',
  },
  {
    icon: <MeetingRoomOutlinedIcon />,
    label: 'Intrarea și zona de așteptare a cabinetului',
    caption: 'Intrarea și zona de așteptare, gândite pentru discreție.',
  },
  {
    icon: <LocalFloristOutlinedIcon />,
    label: 'Detaliu din amenajarea cabinetului',
    caption: 'Detalii calde din amenajare: plante, texturi naturale, culori discrete.',
  },
]

const socialLinks: ReadonlyArray<{ label: string; href: string; icon: ReactNode }> = [
  { label: 'Facebook', href: site.social.facebook, icon: <FacebookIcon /> },
  { label: 'Instagram', href: site.social.instagram, icon: <InstagramIcon /> },
  { label: 'LinkedIn', href: site.social.linkedin, icon: <LinkedInIcon /> },
].filter((link) => link.href.trim().length > 0)

const paragraphSx = { color: 'text.secondary', mb: 2.5 } as const

export default function AboutPage() {
  return (
    <>
      <Seo
        title="Despre mine"
        description="Adina Gghita, psiholog clinician și psihoterapeut: parcursul meu profesional, formările urmate, abordarea terapeutică și cadrul în care se desfășoară ședințele."
      />

      {/* ---------------------------------------------------- Hero scurt ---- */}
      <Box
        component="section"
        sx={({ palette: { brand } }) => ({
          pt: { xs: 6, md: 9 },
          pb: { xs: 5, md: 7 },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: [
            `radial-gradient(80% 120% at 0% 0%, ${brand.secondary}26 0%, transparent 60%)`,
            `radial-gradient(70% 110% at 100% 10%, ${brand.primaryLight}1F 0%, transparent 62%)`,
          ].join(', '),
        })}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                component="p"
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'secondary.dark',
                  mb: 1.5,
                }}
              >
                Despre mine
              </Typography>

              <Typography variant="h1" sx={{ mb: 2 }}>
                {site.shortName}
              </Typography>

              <Typography variant="subtitle1" component="p" sx={{ maxWidth: '58ch', mb: 3 }}>
                {site.role}. Însoțesc copii, adolescenți și adulți în perioade în care lucrurile
                par prea grele pentru a fi duse singuri — {site.tagline.toLowerCase()}.
              </Typography>

              <Stack direction="row" useFlexGap flexWrap="wrap" sx={{ gap: 1.25 }}>
                <Chip
                  icon={<VerifiedOutlinedIcon />}
                  label={site.copsi}
                  variant="outlined"
                  sx={{ height: 'auto', py: 0.75, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                />
                <Chip
                  icon={<LocationOnOutlinedIcon />}
                  label={`${site.address.city}, ${site.address.country}`}
                  variant="outlined"
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <PhotoImage
                src={portretAdina}
                alt={`${site.shortName}, ${site.role.toLowerCase()}`}
                ratio={4 / 5}
                rounded={2}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ---------------------------------------------------- Despre mine ---- */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md">
          <SectionHeading
            eyebrow="Parcursul meu"
            title="Despre mine"
            subtitle="Câteva rânduri despre cine sunt și despre felul în care lucrez, ca să știi la ce să te aștepți înainte de prima ședință."
          />

          <Typography sx={paragraphSx}>
            Mă numesc Adina Gghita și sunt psiholog atestat de Colegiul Psihologilor din România în
            psihologie clinică, psihoterapie cognitiv-comportamentală individuală și de grup și
            psihologie aplicată în domeniul securității naționale. Am ajuns la această profesie
            pornind de la o întrebare care mă însoțește de mult: cum reușesc oamenii să traverseze
            perioade grele și ce anume îi ajută, concret, să se regăsească. Răspunsul pe care l-am
            găsit în practică este mai simplu decât mă așteptam — contează enorm să existe un loc
            în care poți vorbi fără să te cenzurezi și cineva care rămâne alături de tine până se
            limpezesc lucrurile.
          </Typography>

          <Typography sx={paragraphSx}>
            Am finalizat studiile de licență în Psihologie și masterul în Psihologia Sănătății —
            Cercetare Clinică și Optimizare Comportamentală, precum și masterul în Psihologie
            Aplicată în Domeniul Securității Naționale, la Facultatea de Psihologie și Științele
            Educației din cadrul Universității din București.
          </Typography>

          <Typography sx={paragraphSx}>
            În cabinet, primul lucru pe care încerc să îl construiesc este siguranța. Nu grăbesc
            poveștile și nu cer nimănui să fie „pregătit” înainte de a începe. Ședințele nu sunt un
            interogatoriu și nici un set de sfaturi date de la distanță: sunt o conversație
            structurată, în care punem împreună în ordine ceea ce simți, identificăm ce te ține
            blocat și alegem pași care ți se potrivesc. Uneori progresul înseamnă o schimbare
            vizibilă, alteori doar o noapte dormită mai bine — și amândouă contează.
          </Typography>

          <Typography sx={paragraphSx}>
            Lucrez cu adulți care trec prin anxietate, episoade depresive, epuizare profesională,
            pierderi sau despărțiri, cu persoane care își pun întrebări despre stima de sine și
            despre relațiile lor, cu copii și adolescenți care au dificultăți comportamentale sau
            tulburări de neurodezvoltare și cu părinți care caută sprijin în relația cu propriul
            copil. În toate aceste situații pornim de la ceea ce te aduce aici și stabilim
            obiective clare, pe care le revedem periodic, ca să știi unde te afli.
          </Typography>

          <Typography sx={paragraphSx}>
            Pe lângă psihoterapie, realizez evaluări psihologice pentru adolescenți și adulți
            (ADHD, coeficient de inteligență, tulburări de personalitate, atenție, viteză mentală),
            examinări psihologice pentru copii cu dizabilități — necesare pentru comisia de
            handicap și pentru certificatul de orientare școlară — și emit avize psihologice pentru
            voluntariat ISU/SMURD, încadrare sau concurs MAI/MAPN/ANI/ANP, permis tir sportiv,
            atestat pentru agenți de pază și ordine, angajare agenți de pază și polițist comunitar.
          </Typography>

          <Typography sx={paragraphSx}>
            În afara ședințelor, îmi continui formarea și merg constant la supervizare — cred că un
            terapeut care învață în permanență este cel mai bun lucru pe care îl pot oferi
            oamenilor care îmi acordă încrederea lor. Îmi place să citesc, petrec timp în natură și
            am învățat, la rândul meu, cât de mult ajută pauzele. Dacă îți este greu să faci primul
            pas, este în regulă: majoritatea celor care ajung la mine au amânat luni de zile acest
            mesaj.
          </Typography>

          {socialLinks.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Mă poți urmări și pe:
                </Typography>
                <Stack direction="row" spacing={1}>
                  {socialLinks.map((link) => (
                    <Tooltip key={link.label} title={link.label}>
                      <IconButton
                        component="a"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          color: 'primary.main',
                          '&:hover': { backgroundColor: 'background.paper' },
                        }}
                      >
                        {link.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Stack>
              </Stack>
            </>
          )}
        </Container>
      </Box>

      {/* --------------------------------------- Formare și certificări ---- */}
      <Box
        component="section"
        sx={{
          py: { xs: 7, md: 10 },
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <SectionHeading
            eyebrow="Pregătire profesională"
            title="Formare și certificări"
            subtitle="Practica de psiholog este reglementată: fiecare intervenție se sprijină pe o formare acreditată și pe supervizare continuă."
          />

          <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {trainings.map((training) => (
              <Stack
                key={training.title}
                component="li"
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.default',
                }}
              >
                <WorkspacePremiumOutlinedIcon sx={{ color: 'secondary.dark', mt: 0.25 }} />
                <Box>
                  <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
                    {training.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {training.detail}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 4 }}>
            <SchoolOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Titlurile complete ale programelor de formare, instituțiile care le-au eliberat și
              anii de absolvire pot fi consultate la cerere, în cabinet.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* ------------------------------------ Abordarea mea terapeutică ---- */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="Metodă de lucru"
            title="Abordarea mea terapeutică"
            subtitle="Trei direcții care se completează. Alegerea nu se face teoretic, ci împreună cu tine, în funcție de ceea ce ai nevoie."
            align="center"
          />

          <Grid container spacing={3}>
            {approaches.map((approach) => (
              <Grid key={approach.title} size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2.5,
                        color: 'primary.main',
                        backgroundColor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {approach.icon}
                    </Box>

                    <Typography variant="h4" component="h3" sx={{ mb: 1.5 }}>
                      {approach.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {approach.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ------------------------------------------------------ Cabinetul ---- */}
      <Box
        component="section"
        sx={{
          py: { xs: 7, md: 10 },
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <SectionHeading
            eyebrow="Cadrul ședințelor"
            title="Cabinetul"
            subtitle={`Un spațiu liniștit în ${site.address.city}, gândit să te ajute să te așezi și să respiri. Ședințele se pot desfășura și online, dacă îți este mai simplu.`}
          />

          <Grid container spacing={3}>
            {officeGallery.map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                  }}
                >
                  {/* Fotografiile reale ale cabinetului urmează (plan §11). */}
                  <PlaceholderImage icon={item.icon} label={item.label} ratio={4 / 3} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 2 }}>
                    {item.caption}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 3 }}>
            Adresa completă și indicațiile de acces se găsesc în pagina de contact, împreună cu
            programul cabinetului.
          </Typography>
        </Container>
      </Box>

      {/* ---------------------------------------------------- CTA final ---- */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <CtaBanner
            title="Dacă simți că e momentul, îți răspund"
            description="Poți începe cu un mesaj scurt: câteva rânduri despre ce te frământă sunt suficiente. Îți propun apoi un interval potrivit pentru prima ședință, în cabinet sau online."
          />
        </Container>
      </Box>
    </>
  )
}
