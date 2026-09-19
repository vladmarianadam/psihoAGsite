import { createTheme, responsiveFontSizes, type Theme } from '@mui/material/styles'

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
  },
  // „Răsărit la mare” — inspirată din fotografia cu marea în amurg și maci pe faleză:
  // albastrul adânc al apei, cerul ambră de la orizont, nisipul cald și roșul macilor.
  seaside: {
    primary: '#3F5A73',
    primaryDark: '#2C4256',
    primaryLight: '#7A97B0',
    secondary: '#E8A26A',
    secondaryDark: '#C97D45',
    accent: '#D9432B',
    background: '#F8F2E9',
    surface: '#FFFFFF',
    text: '#22303B',
    textMuted: '#55656F',
    border: '#E4DACC',
    shadowRgb: '34, 48, 59',
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
