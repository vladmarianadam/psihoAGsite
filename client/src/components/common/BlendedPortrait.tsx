import { Box } from '@mui/material'

import PhotoImage from './PhotoImage'

interface BlendedPortraitProps {
  /** Fotografia; un decupaj fără fundal (PNG/WebP transparent) s-ar pune tot aici. */
  src: string
  alt: string
  ratio?: number
}

/** Portret în fereastră arcuită, cu bordură în gradient care se rotește lent (stiluri în index.css). */
export default function BlendedPortrait({ src, alt, ratio = 4 / 5 }: BlendedPortraitProps) {
  return (
    <Box className="portrait-wrap">
      <PhotoImage src={src} alt={alt} ratio={ratio} className="portrait" />
    </Box>
  )
}
