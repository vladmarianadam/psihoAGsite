import { createTheme, responsiveFontSizes, type Theme } from '@mui/material/styles'

import seasideHero from './assets/seaside-hero.jpg'
import seasideFooter from './assets/seaside-footer.jpg'

/** Identificatorii temelor disponibile. `calm` este tema implicită (plan §6). */
export type ThemeId = 'calm' | 'seaside'

/**
 * Culorile de brand ale unei teme. Aceleași chei există în fiecare temă, astfel încât
 * componentele să citească `theme.palette.brand.*` fără să știe care temă e activă.
 */
export interface BrandPalette {
  primary: string
  primaryDark: string
  primaryLight: string
  secondary: string
  secondaryDark: string
  /** Accent rar, pentru mici evidențieri (maci în tema „seaside”). */
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  /** Culoarea umbrelor, ca triplet RGB („44, 54, 57”), pentru rgba(). */
  shadowRgb: string
  /** Fundalul secțiunilor „tint” — o valoare validă pentru `background-image` (gradient CSS). */
  sectionTint: string
  /** Fundalul benzii de apel la acțiune (gradient CSS). */
  ctaGradient: string
  /**
   * Fotografii de atmosferă pentru hero și footer. Când lipsesc, secțiunile folosesc
   * gradientele discrete ale temei; când există, textul trece pe deschis peste imagine.
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
  // Paleta din plan §6 — calmă, adaptată unui cabinet de psihologie.
  calm: {
    primary: '#4A6D7C',
    primaryDark: '#365360',
    primaryLight: '#6E909E',
    secondary: '#C9A882',
    secondaryDark: '#AD8B64',
    accent: '#AD8B64',
    background: '#FAF8F5',
    surface: '#FFFFFF',
    text: '#2C3639',
    textMuted: '#5B686C',
    border: '#E6E0D8',
    shadowRgb: '44, 54, 57',
    sectionTint: 'linear-gradient(#C9A88214, #C9A88214)',
    ctaGradient: [
      'radial-gradient(90% 130% at 100% 0%, #AD8B6459 0%, transparent 58%)',
      'linear-gradient(135deg, #4A6D7C 0%, #365360 100%)',
    ].join(', '),
  },
  // „Răsărit la mare” — inspirată din fotografia cu marea în amurg și maci pe faleză:
  // albastrul adânc al apei, cerul ambră de la orizont, nisipul cald și roșul macilor.
  seaside: {
    primary: '#3F5A73',
    primaryDark: '#2C4256',
    primaryLight: '#7A97B0',
    secondary: '#F29B5C',
    secondaryDark: '#C97D45',
    accent: '#D9432B',
    background: '#FBF3E8',
    surface: '#FFFFFF',
    text: '#22303B',
    textMuted: '#55656F',
    border: '#E9DCCB',
    shadowRgb: '34, 48, 59',
    // Amurg peste nisip: piersică sus, albastru de cer jos.
    sectionTint: [
      'radial-gradient(120% 90% at 0% 0%, #F29B5C2E 0%, transparent 55%)',
      'radial-gradient(110% 90% at 100% 100%, #7A97B033 0%, transparent 55%)',
      'linear-gradient(180deg, #FFF7EE 0%, #F6EEE4 100%)',
    ].join(', '),
    // Soare la orizont → apă adâncă; textul alb rămâne lizibil pe toată lungimea.
    ctaGradient: [
      'radial-gradient(70% 120% at 10% 0%, #F29B5C66 0%, transparent 55%)',
      'linear-gradient(115deg, #B8482A 0%, #8E3A44 38%, #3F5A73 72%, #22364B 100%)',
    ].join(', '),
    imagery: { hero: seasideHero, footer: seasideFooter, overlayRgb: '20, 38, 56' },
  },
}

export const themeMeta: Record<ThemeId, { label: string; description: string }> = {
  calm: { label: 'Calm', description: 'Verde-albăstrui și bej cald' },
  seaside: { label: 'Răsărit la mare', description: 'Albastru marin, ambră și maci' },
}

export const DEFAULT_THEME_ID: ThemeId = 'calm'

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'calm' || value === 'seaside'
}

const headingFont = '"Cormorant Garamond", "Playfair Display", Georgia, serif'
const bodyFont = '"Inter", "Segoe UI", Roboto, system-ui, sans-serif'

export function buildTheme(id: ThemeId): Theme {
  const palette = palettes[id]

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: palette.primary, dark: palette.primaryDark, light: palette.primaryLight, contrastText: '#FFFFFF' },
      secondary: { main: palette.secondary, dark: palette.secondaryDark, contrastText: palette.text },
      background: { default: palette.background, paper: palette.surface },
      text: { primary: palette.text, secondary: palette.textMuted },
      divider: palette.border,
      brand: palette,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 600, fontSize: '3rem', lineHeight: 1.15, letterSpacing: '-0.5px' },
      h2: { fontFamily: headingFont, fontWeight: 600, fontSize: '2.25rem', lineHeight: 1.2 },
      h3: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.25 },
      h4: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.4rem' },
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
          html: { scrollBehavior: 'smooth' },
          body: {
            backgroundColor: palette.background,
            color: palette.text,
            transition: 'background-color .3s ease, color .3s ease',
          },
          '::selection': { backgroundColor: palette.secondary, color: palette.text },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 22, paddingBlock: 10 },
          sizeLarge: { paddingInline: 30, paddingBlock: 13, fontSize: '1rem' },
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
          root: {
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            transition: 'box-shadow .25s ease, transform .25s ease',
            '&:hover': { boxShadow: `0 12px 32px rgba(${palette.shadowRgb}, 0.09)`, transform: 'translateY(-3px)' },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
      MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            marginBottom: 12,
            '&::before': { display: 'none' },
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
