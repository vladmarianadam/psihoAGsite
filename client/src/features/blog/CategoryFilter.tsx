import { Link as RouterLink } from 'react-router-dom'
import { Box, Chip } from '@mui/material'

import type { CategoryDto } from '../../api/types'

interface CategoryFilterProps {
  categories: CategoryDto[]
  activeSlug?: string | null
}

/**
 * Filtrul de categorii al blogului. Fiecare chip este un link real, ca să poată fi
 * deschis într-o filă nouă și indexat: „Toate” duce la /blog, restul la
 * /blog/categorie/{slug}.
 */
export default function CategoryFilter({ categories, activeSlug = null }: CategoryFilterProps) {
  const allIsActive = !activeSlug

  return (
    <Box
      component="nav"
      aria-label="Filtrează articolele după categorie"
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
    >
      <Chip
        component={RouterLink}
        to="/blog"
        clickable
        label="Toate"
        color={allIsActive ? 'primary' : 'default'}
        variant={allIsActive ? 'filled' : 'outlined'}
        aria-current={allIsActive ? 'page' : undefined}
        sx={{ fontWeight: allIsActive ? 600 : 500 }}
      />

      {categories.map((category) => {
        const isActive = category.slug === activeSlug

        return (
          <Chip
            key={category.id}
            component={RouterLink}
            to={`/blog/categorie/${category.slug}`}
            clickable
            label={`${category.name} (${category.articleCount})`}
            color={isActive ? 'primary' : 'default'}
            variant={isActive ? 'filled' : 'outlined'}
            aria-current={isActive ? 'page' : undefined}
            sx={{ fontWeight: isActive ? 600 : 500 }}
          />
        )
      })}
    </Box>
  )
}
