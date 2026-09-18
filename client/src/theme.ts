import { createTheme, responsiveFontSizes } from '@mui/material/styles'

// Paleta din plan §6 — calmă, adaptată unui cabinet de psihologie.
export const palette = {
  primary: '#4A6D7C',
  primaryDark: '#365360',
  primaryLight: '#6E909E',
  secondary: '#C9A882',
  secondaryDark: '#AD8B64',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  text: '#2C3639',
  textMuted: '#5B686C',
  border: '#E6E0D8',
} as const

const headingFont = '"Cormorant Garamond", "Playfair Display", Georgia, serif'
const bodyFont = '"Inter", "Segoe UI", Roboto, system-ui, sans-serif'

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.primary, dark: palette.primaryDark, light: palette.primaryLight, contrastText: '#FFFFFF' },
    secondary: { main: palette.secondary, dark: palette.secondaryDark, contrastText: '#2C3639' },
    background: { default: palette.background, paper: palette.surface },
    text: { primary: palette.text, secondary: palette.textMuted },
    divider: palette.border,
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
        body: { backgroundColor: palette.background, color: palette.text },
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
          '&:hover': { boxShadow: '0 12px 32px rgba(44, 54, 57, 0.09)', transform: 'translateY(-3px)' },
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

theme = responsiveFontSizes(theme, { factor: 2.2 })

export default theme
