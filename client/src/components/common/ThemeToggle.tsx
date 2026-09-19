import { IconButton, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import WavesRoundedIcon from '@mui/icons-material/WavesRounded'
import SpaRoundedIcon from '@mui/icons-material/SpaRounded'

import { themeMeta } from '../../theme'
import { useThemeMode } from '../../themeMode'

interface ThemeToggleProps {
  /** Dimensiunea butonului; `small` în bara de navigare, `medium` în meniul mobil. */
  size?: 'small' | 'medium'
  /** Culoarea iconiței (cheie din paletă sau CSS); implicit culoarea textului. */
  color?: string
}

/**
 * Comută între tema „Calm” și „Răsărit la mare”. Iconița arată tema către care se trece,
 * iar eticheta accesibilă spune explicit ce se întâmplă la apăsare.
 */
export default function ThemeToggle({ size = 'small', color = 'text.primary' }: ThemeToggleProps) {
  const { themeId, toggleTheme } = useThemeMode()
  const nextId = themeId === 'calm' ? 'seaside' : 'calm'
  const label = `Schimbă tema: ${themeMeta[nextId].label}`

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleTheme}
        aria-label={label}
        size={size}
        sx={(theme) => ({
          color,
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
        })}
      >
        {nextId === 'seaside' ? (
          <WavesRoundedIcon fontSize={size === 'small' ? 'small' : 'medium'} />
        ) : (
          <SpaRoundedIcon fontSize={size === 'small' ? 'small' : 'medium'} />
        )}
      </IconButton>
    </Tooltip>
  )
}
