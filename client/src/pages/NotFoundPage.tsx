import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Link, Stack, Typography } from '@mui/material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'

import Seo from '../components/common/Seo'

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Pagina nu a fost găsită" noIndex />

      <Box
        component="section"
        sx={({ palette: { brand } }) => ({
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          backgroundImage: [
            `radial-gradient(70% 90% at 50% 0%, ${brand.secondary}1F 0%, transparent 65%)`,
          ].join(', '),
        })}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              width: 84,
              height: 84,
              mx: 'auto',
              mb: 3,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '& svg': { fontSize: '2.25rem' },
            }}
          >
            <SearchOffRoundedIcon />
          </Box>

          <Typography
            component="p"
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: 'secondary.dark',
              mb: 1.5,
            }}
          >
            EROARE 404
          </Typography>

          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 2 }}>
            Pagina nu a fost găsită
          </Typography>

          <Typography variant="subtitle1" component="p" sx={{ mb: 4 }}>
            Se întâmplă: adresa a fost scrisă greșit, linkul a expirat sau pagina a fost mutată.
            Nimic nu s-a pierdut — te pot îndruma mai departe de aici.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              component={RouterLink}
              to="/"
              size="large"
              variant="contained"
              startIcon={<HomeRoundedIcon />}
            >
              Înapoi la pagina principală
            </Button>
            <Button
              component={RouterLink}
              to="/contact"
              size="large"
              variant="outlined"
              startIcon={<MailOutlineRoundedIcon />}
            >
              Scrie-mi un mesaj
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={2.5}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ color: 'text.secondary' }}
          >
            <Link
              component={RouterLink}
              to="/blog"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <ArticleOutlinedIcon fontSize="small" />
              Articole din blog
            </Link>

            <Link
              component={RouterLink}
              to="/contact"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <MailOutlineRoundedIcon fontSize="small" />
              Date de contact și program
            </Link>
          </Stack>
        </Container>
      </Box>
    </>
  )
}
