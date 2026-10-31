import { IconButton, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import WavesRoundedIcon from '@mui/icons-material/WavesRounded'
import WbTwilightRoundedIcon from '@mui/icons-material/WbTwilightRounded'

import { themeMeta } from '../../theme'
import { useThemeMode } from '../../themeMode'

interface ThemeToggleProps {
  /** Dimensiunea butonului; `small` în bara de navigare, `medium` în meniul mobil. */
  size?: 'small' | 'medium'
  /** Culoarea iconiței (cheie din paletă sau CSS); implicit culoarea textului. */
  color?: string
}

/**
 * Comută între „Dimineață la mare” și „Apus la mare”. Iconița arată tema către care se trece
 * (val ↔ soare la orizont) și intră rotindu-se; noua temă se dezvăluie în cerc din punctul apăsat.
 */
export default function ThemeToggle({ size = 'small', color = 'text.primary' }: ThemeToggleProps) {
  const { themeId, toggleTheme } = useThemeMode()
  const nextId = themeId === 'calm' ? 'seaside' : 'calm'
  const label = `Schimbă tema: ${themeMeta[nextId].label}`
  const Icon = nextId === 'seaside' ? WbTwilightRoundedIcon : WavesRoundedIcon

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={(event) => {
          // La activarea din tastatură coordonatele sunt 0 — cercul pornește atunci din centrul butonului.
          const rect = event.currentTarget.getBoundingClientRect()
          const fromPointer = event.clientX !== 0 || event.clientY !== 0
          toggleTheme({
            x: fromPointer ? event.clientX : rect.left + rect.width / 2,
            y: fromPointer ? event.clientY : rect.top + rect.height / 2,
          })
        }}
        aria-label={label}
        size={size}
        sx={(theme) => ({
          color,
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
        })}
      >
        <Icon
          key={nextId}
          fontSize={size === 'small' ? 'small' : 'medium'}
          sx={{ animation: 'icon-turn-in .6s cubic-bezier(.2,.8,.2,1)' }}
        />
      </IconButton>
    </Tooltip>
  )
}
