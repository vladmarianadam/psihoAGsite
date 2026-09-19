import { Box } from '@mui/material'

interface PhotoImageProps {
  /** Sursa imaginii, importată din `src/assets` ca să primească hash la build. */
  src: string
  /** Text alternativ — obligatoriu, fotografiile de conținut nu sunt decorative. */
  alt: string
  /** Raportul lățime/înălțime, ex. `4 / 5`. Implicit `4 / 5`. */
  ratio?: number
  /** Multiplu de spacing pentru colțuri rotunjite. Implicit 0 (colțurile le dă containerul). */
  rounded?: number
  /** Poziția subiectului în cadru, pentru decupaje care taie fruntea sau bărbia. */
  objectPosition?: string
}

/**
 * Fotografie reală de conținut, cu același contract de props ca `PlaceholderImage`,
 * ca înlocuirea unui placeholder să fie o schimbare de o linie. Păstrează raportul
 * cerut și decupează cu `object-fit: cover`, deci nu deformează niciodată portretul.
 */
export default function PhotoImage({
  src,
  alt,
  ratio = 4 / 5,
  rounded = 0,
  objectPosition = 'center 20%',
}: PhotoImageProps) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sx={{
        display: 'block',
        width: '100%',
        aspectRatio: String(ratio),
        objectFit: 'cover',
        objectPosition,
        borderRadius: rounded,
      }}
    />
  )
}
