import { Box } from '@mui/material'

import PhotoImage from './PhotoImage'

interface BlendedPortraitProps {
  /**
   * Cel mai bun rezultat îl dă un decupaj fără fundal (PNG/WebP transparent): atunci haloul se vede
   * direct în jurul siluetei. Până atunci, masca estompată și multiply (tema „calm”) ascund
   * fundalul de studio. Pentru decupaj se schimbă doar această sursă.
   */
  src: string
  alt: string
  ratio?: number
}

/** Portret fără marginile unui dreptunghi: formă organică, margini estompate, halo care se rotește. */
export default function BlendedPortrait({ src, alt, ratio = 4 / 5 }: BlendedPortraitProps) {
  return (
    <Box className="portrait-wrap">
      <PhotoImage src={src} alt={alt} ratio={ratio} className="portrait" />
    </Box>
  )
}
