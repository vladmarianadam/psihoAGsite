import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import Layout from './components/layout/Layout'
import ScrollToTop from './components/common/ScrollToTop'
import { AuthProvider } from './features/management/hooks/useAuth'
import ProtectedRoute from './features/management/components/ProtectedRoute'

import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import BlogPage from './pages/BlogPage'
import ArticlePage from './pages/ArticlePage'
import ContactPage from './pages/ContactPage'
import LegalPage from './pages/LegalPage'
import NotFoundPage from './pages/NotFoundPage'

/**
 * Panoul de management se încarcă lazy: codul lui ajunge într-un chunk separat,
 * nu în bundle-ul public, deci nu lasă indicii despre existența lui (plan §7).
 */
const AdminLayout = lazy(() => import('./features/management/components/AdminLayout'))
const LoginPage = lazy(() => import('./features/management/pages/LoginPage'))
const DashboardPage = lazy(() => import('./features/management/pages/DashboardPage'))
const ArticlesListPage = lazy(() => import('./features/management/pages/ArticlesListPage'))
const ArticleEditorPage = lazy(() => import('./features/management/pages/ArticleEditorPage'))
const CategoriesPage = lazy(() => import('./features/management/pages/CategoriesPage'))
const AdminServicesPage = lazy(() => import('./features/management/pages/ServicesPage'))
const TestimonialsPage = lazy(() => import('./features/management/pages/TestimonialsPage'))
const FaqPage = lazy(() => import('./features/management/pages/FaqPage'))
const AppointmentsPage = lazy(() => import('./features/management/pages/AppointmentsPage'))
const SettingsPage = lazy(() => import('./features/management/pages/SettingsPage'))

function RouteFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress aria-label="Se încarcă" />
    </Box>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* ---------------- Site public ---------------- */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="despre" element={<AboutPage />} />
          <Route path="servicii" element={<ServicesPage />} />
          <Route path="servicii/:slug" element={<ServiceDetailPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/categorie/:slug" element={<BlogPage />} />
          <Route path="blog/:slug" element={<ArticlePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="termeni-si-conditii" element={<LegalPage document="terms" />} />
          <Route path="politica-de-confidentialitate" element={<LegalPage document="privacy" />} />
          <Route path="politica-de-cookies" element={<LegalPage document="cookies" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ------- Management: layout separat, fără linkuri din site (plan §7) ------- */}
        <Route
          path="management/login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="management"
          element={
            <ProtectedRoute>
              <Suspense fallback={<RouteFallback />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="articole" element={<ArticlesListPage />} />
          <Route path="articole/nou" element={<ArticleEditorPage />} />
          <Route path="articole/:id" element={<ArticleEditorPage />} />
          <Route path="categorii" element={<CategoriesPage />} />
          <Route path="servicii" element={<AdminServicesPage />} />
          <Route path="testimoniale" element={<TestimonialsPage />} />
          <Route path="intrebari-frecvente" element={<FaqPage />} />
          <Route path="programari" element={<AppointmentsPage />} />
          <Route path="setari" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/management" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
