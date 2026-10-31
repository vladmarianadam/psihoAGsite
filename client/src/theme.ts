import { alpha, createTheme, responsiveFontSizes, type Theme } from '@mui/material/styles'

import seasideHero from './assets/seaside-hero.jpg'
import seasideFooter from './assets/seaside-footer.jpg'

/** Identificatorii temelor disponibile. `calm` este tema implicită (plan §6). */
export type ThemeId = 'calm' | 'seaside'

/**
 * Culorile de brand ale unei teme. Aceleași chei există în fiecare temă, astfel încât
 * componentele să citească `theme.palette.brand.*` fără să știe care temă e activă.
 * Tot de aici se generează variabilele CSS (`--bg`, `--c1`…) folosite în index.css.
 */
export interface BrandPalette {
  mode: 'light' | 'dark'
  primary: string
  primaryDark: string
  primaryLight: string
  secondary: string
  secondaryDark: string
  /** Accent rar, pentru mici evidențieri. */
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  /** Culoarea umbrelor, ca triplet RGB („44, 54, 57”), pentru rgba(). */
  shadowRgb: string
  /** Cele patru lumini ale fundalului animat (aurora) — decorative, fără cerințe de contrast. */
  aurora: [string, string, string, string]
  /** Modul de amestec al luminilor: `multiply` pe fundal deschis, `screen` pe fundal închis. */
  blend: 'multiply' | 'screen'
  /** Accente sigure pentru text și butoane (contrast AA verificat pe fundalul temei). */
  accents: [string, string, string]
  /** Textul pus peste accente (butoane pline, etichete-pastilă). */
  onAccent: string
  /** Gradientul butoanelor secundare și textul de pe ele. */
  secondaryGradient: [string, string]
  onSecondary: string
  /** Fundalul benzii de apel la acțiune (gradient CSS); textul de pe ea e alb. */
  ctaGradient: string
  /**
   * Fotografii de atmosferă pentru hero și footer. Când lipsesc, secțiunile rămân pe aurora;
   * când există, textul trece pe deschis peste imagine.
   */
  imagery?: {
    hero: string
    footer: string
    /** Culoarea de bază a suprapunerii peste fotografii, ca triplet RGB. */
    overlayRgb: string
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    brand: BrandPalette
  }
  interface PaletteOptions {
    brand?: BrandPalette
  }
}

export const palettes: Record<ThemeId, BrandPalette> = {
  // „Dimineață la mare” — aqua, cer, lavandă și mentă pe alb înghețat.
  calm: {
    mode: 'light',
    primary: '#0F57B0',
    primaryDark: '#0B4289',
    primaryLight: '#3AA0FF',
    secondary: '#2FD6C3',
    secondaryDark: '#0B7A71',
    accent: '#7C5CFF',
    background: '#EEF5FB',
    surface: '#FFFFFF',
    text: '#0F1D33',
    textMuted: '#3B4A63',
    border: '#D3E1EE',
    shadowRgb: '15, 29, 51',
    aurora: ['#3AA0FF', '#7C5CFF', '#2FD6C3', '#9FE3FF'],
    blend: 'multiply',
    // Variante închise ale luminilor: text alb peste ele ≥ 4.5:1, iar ca text pe fundal ≥ 4.5:1.
    accents: ['#0F57B0', '#5A3FD6', '#0B7A71'],
    onAccent: '#FFFFFF',
    secondaryGradient: ['#2FD6C3', '#9FE3FF'],
    onSecondary: '#0F1D33',
    ctaGradient: [
      'radial-gradient(80% 130% at 100% 0%, #2FD6C366 0%, transparent 58%)',
      'linear-gradient(125deg, #0F57B0 0%, #5A3FD6 100%)',
    ].join(', '),
  },
  // „Apus la mare” — coral, magenta, ambră și violet pe prună; păstrează fotografia cu marea.
  seaside: {
    mode: 'dark',
    primary: '#FF7A59',
    primaryDark: '#E2553A',
    primaryLight: '#FFA184',
    secondary: '#FFC15E',
    secondaryDark: '#FF3D7F',
    accent: '#FF3D7F',
    background: '#1B0F2A',
    surface: '#2A1838',
    text: '#FFF4EC',
    textMuted: '#E3C9C0',
    border: '#463052',
    shadowRgb: '8, 3, 15',
    aurora: ['#FF7A59', '#FF3D7F', '#FFC15E', '#7B5CFF'],
    blend: 'screen',
    // Pe prună, luminile sunt deja lizibile; peste ele se scrie cu prună închisă (≥ 5:1).
    accents: ['#FF7A59', '#FF3D7F', '#FFC15E'],
    onAccent: '#1B0F2A',
    secondaryGradient: ['#FFC15E', '#FF7A59'],
    onSecondary: '#1B0F2A',
    // Variante mai adânci decât luminile, ca textul alb al bannerului să rămână ≥ 4.5:1.
    ctaGradient: [
      'radial-gradient(70% 120% at 10% 0%, #FFC15E40 0%, transparent 55%)',
      'linear-gradient(115deg, #B8482A 0%, #8E2A5E 50%, #3E2A8C 100%)',
    ].join(', '),
    imagery: { hero: seasideHero, footer: seasideFooter, overlayRgb: '27, 15, 42' },
  },
}

export const themeMeta: Record<ThemeId, { label: string; description: string }> = {
  calm: { label: 'Dimineață la mare', description: 'Aqua, cer și lavandă pe alb' },
  seaside: { label: 'Apus la mare', description: 'Coral, magenta și ambră pe prună' },
}

export const DEFAULT_THEME_ID: ThemeId = 'calm'

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'calm' || value === 'seaside'
}

const headingFont = '"Sora", "Inter", "Segoe UI", system-ui, sans-serif'
const bodyFont = '"Inter", "Segoe UI", Roboto, system-ui, sans-serif'

/** Variabilele CSS ale temei, scrise pe `:root`; index.css și componentele le citesc direct. */
function cssVariables(palette: BrandPalette): Record<string, string> {
  const [c1, c2, c3, c4] = palette.aurora
  const [a1, a2, a3] = palette.accents
  return {
    '--bg': palette.background,
    '--surface': palette.surface,
    '--text': palette.text,
    '--muted': palette.textMuted,
    '--border': palette.border,
    '--c1': c1,
    '--c2': c2,
    '--c3': c3,
    '--c4': c4,
    '--blend': palette.blend,
    '--accent-1': a1,
    '--accent-2': a2,
    '--accent-3': a3,
    '--on-accent': palette.onAccent,
    '--secondary-1': palette.secondaryGradient[0],
    '--secondary-2': palette.secondaryGradient[1],
    '--on-secondary': palette.onSecondary,
    // Secțiunile lasă aurora să se vadă; cardurile de sticlă sunt mai opace, pentru lizibilitate.
    '--section': 'color-mix(in oklab, var(--surface) 40%, transparent)',
    '--section-tint': 'color-mix(in oklab, var(--accent-1) 7%, color-mix(in oklab, var(--surface) 30%, transparent))',
    '--glass': 'color-mix(in oklab, var(--surface) 65%, transparent)',
  }
}

/**
 * Lumina de sub cursor: un inel de 1.5px pe marginea cardului, centrat în --mx/--my
 * (scrise de useSpotlight). Fără cursor, centrul stă în afara cardului și inelul nu se vede.
 */
const spotlightRing = {
  content: '""',
  position: 'absolute',
  inset: 0,
  height: 'auto',
  opacity: 1,
  borderRadius: 'inherit',
  padding: '1.5px',
  pointerEvents: 'none',
  backgroundColor: 'transparent',
  backgroundImage:
    'radial-gradient(350px circle at var(--mx, -999px) var(--my, -999px), var(--accent, var(--c1)), var(--c2) 30%, transparent 60%)',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
} as const

interface BuildThemeOptions {
  /**
   * `false` pentru panoul de management: aceleași culori, dar fără sticlă, lumină sub cursor și
   * ridicarea cardurilor — acolo cardurile țin tabele și formulare, nu decor.
   */
  ambient?: boolean
}

export function buildTheme(id: ThemeId, { ambient = true }: BuildThemeOptions = {}): Theme {
  const palette = palettes[id]

  // Buton plin cu gradient care alunecă la hover; aceeași umbră în toate stările, ca să nu „sară”.
  const gradientButton = (stops: string, ink: string) => ({
    color: ink,
    backgroundImage: `linear-gradient(120deg, ${stops})`,
    backgroundSize: '200% auto',
    boxShadow: '0 10px 30px -10px var(--c2)',
    transition: 'background-position .6s ease, transform .2s ease, box-shadow .2s ease',
    '&:hover': { backgroundPosition: '100% center', transform: 'translateY(-2px) scale(1.03)' },
  })

  const theme = createTheme({
    palette: {
      mode: palette.mode,
      primary: { main: palette.primary, dark: palette.primaryDark, light: palette.primaryLight, contrastText: palette.onAccent },
      secondary: { main: palette.secondary, dark: palette.secondaryDark, contrastText: palette.onSecondary },
      background: { default: palette.background, paper: palette.surface },
      text: { primary: palette.text, secondary: palette.textMuted },
      divider: palette.border,
      brand: palette,
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 700, fontSize: '3.25rem', lineHeight: 1.1, letterSpacing: '-0.03em' },
      h2: { fontFamily: headingFont, fontWeight: 600, fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
      h3: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.01em' },
      h4: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.4rem', letterSpacing: '-0.01em' },
      h5: { fontFamily: bodyFont, fontWeight: 600, fontSize: '1.15rem' },
      h6: { fontFamily: bodyFont, fontWeight: 600, fontSize: '1rem' },
      subtitle1: { fontSize: '1.125rem', lineHeight: 1.6, color: palette.textMuted },
      body1: { fontSize: '1rem', lineHeight: 1.75 },
      body2: { fontSize: '0.9375rem', lineHeight: 1.7 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': cssVariables(palette),
          html: {
            scrollBehavior: 'smooth',
            // Fundalul stă pe <html> (deci pe canvas), ca aurora cu z-index negativ să rămână deasupra lui.
            backgroundColor: 'var(--bg)',
            transition: 'background-color .6s ease',
          },
          body: {
            backgroundColor: 'transparent',
            color: palette.text,
            transition: 'color .6s ease',
          },
          '::selection': { backgroundColor: palette.secondary, color: palette.onSecondary },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 22,
            paddingBlock: 10,
            transition: 'transform .2s ease, box-shadow .2s ease, background-color .2s ease, border-color .2s ease',
          },
          sizeLarge: { paddingInline: 30, paddingBlock: 13, fontSize: '1rem' },
          ...(ambient && {
            containedPrimary: gradientButton('var(--accent-1), var(--accent-2), var(--accent-3)', 'var(--on-accent)'),
            containedSecondary: gradientButton('var(--secondary-1), var(--secondary-2), var(--secondary-1)', 'var(--on-secondary)'),
            // Bordură în gradient la hover: un fundal pe padding-box acoperă gradientul de pe border-box.
            outlined: {
              '&:hover': {
                borderColor: 'transparent',
                background:
                  'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(120deg, var(--accent-1), var(--accent-2)) border-box',
              },
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: palette.border },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ambient
            ? {
                position: 'relative',
                borderRadius: 24,
                backgroundColor: 'var(--glass)',
                backdropFilter: 'blur(16px) saturate(140%)',
                border: '1px solid var(--border)',
                transition: 'transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease',
                '&::before': spotlightRing,
                '@media (hover: hover)': {
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 25px 60px -20px var(--accent, var(--c2))',
                  },
                },
              }
            : { border: `1px solid ${palette.border}`, borderRadius: 16 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 500 },
          outlined: { borderColor: palette.border, backgroundColor: alpha(palette.primary, 0.06) },
        },
      },
      MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            marginBottom: 12,
            // MUI desenează separatorul în ::before; aici îl înlocuim cu inelul de lumină.
            '&::before': ambient ? spotlightRing : { display: 'none' },
            ...(ambient && {
              backgroundColor: 'var(--glass)',
              backdropFilter: 'blur(16px) saturate(140%)',
              transition: 'border-color .35s ease, box-shadow .35s ease',
              '&:first-of-type::before': { display: 'block' },
              '&.Mui-expanded': { borderColor: 'var(--accent-1)', boxShadow: '0 18px 40px -24px var(--c2)' },
              '&.Mui-expanded::before': { opacity: 1 },
            }),
          },
        },
      },
      MuiAppBar: { defaultProps: { elevation: 0, color: 'transparent' } },
      MuiLink: { defaultProps: { underline: 'hover' } },
    },
  })

  return responsiveFontSizes(theme, { factor: 2.2 })
}

/** Tema implicită — păstrată pentru compatibilitate; aplicația folosește `ThemeModeProvider`. */
const theme = buildTheme(DEFAULT_THEME_ID)

export default theme
