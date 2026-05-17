import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Menu from '@/pages/Menu'
import Products from '@/pages/Products'
import Settings from '@/pages/Settings'
import Account from '@/pages/Account'
import Employees from '@/pages/Employees'
import Auth from '@/pages/Auth'
import { useUIStore, applyTheme } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useAuthStore, ROLES } from '@/store/useAuthStore'
import CookieBanner from '@/components/ui/CookieBanner'
import CountrySelectorModal from '@/components/modals/CountrySelectorModal'

// ── Guards ────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

function RequirePermission({ perm, children }) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'despachador'
  const allowed = ROLES[role]?.permissions[perm] ?? false
  return allowed ? children : <Navigate to="/" replace />
}

export default function App() {
  const theme = useUIStore((s) => s.theme)
  const fetchRates = useCurrencyStore((s) => s.fetchRates)
  const isStale = useCurrencyStore((s) => s.isStale)
  const checkOverdue = useInvoiceStore((s) => s.checkOverdue)
  const initAuth = useAuthStore((s) => s.init)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  const location = useLocation()
  useEffect(() => {
    console.log('🛡️ Gestiva Auth State:', { isAuthenticated, user: user?.email, path: location.pathname })
  }, [isAuthenticated, user, location.pathname])

  const pageTitles = {
    '/': 'Dashboard',
    '/menu': 'Menú',
    '/products': 'Productos',
    '/employees': 'Empleados',
    '/settings': 'Configuración',
    '/account': 'Cuenta',
    '/auth': 'Acceso'
  }

  useEffect(() => {
    applyTheme(theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  useEffect(() => {
    const originalTitle = `GO | ${pageTitles[location.pathname] || 'GestivaOne'}`
    const attentionTitle = '¡Tienes una factura pendiente! 📄'
    
    document.title = originalTitle

    const handleVisibility = () => {
      document.title = document.hidden ? attentionTitle : originalTitle
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [location.pathname])

  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/auth') {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, location.pathname, navigate])

  useEffect(() => { initAuth() }, [])
  useEffect(() => { if (isStale()) fetchRates() }, [])
  useEffect(() => { checkOverdue() }, [])

  return (
    <>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/auth" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} 
        />

        {/* Protected Routes */}
        <Route
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/auth" replace />}
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/menu" element={<RequirePermission perm="menu"><Menu /></RequirePermission>} />
          <Route path="/products" element={<RequirePermission perm="products"><Products /></RequirePermission>} />
          <Route path="/employees" element={<RequirePermission perm="employees"><Employees /></RequirePermission>} />
          <Route path="/settings" element={<RequirePermission perm="settings"><Settings /></RequirePermission>} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <CookieBanner />
      <CountrySelectorModal />
      <Analytics />
    </>
  )
}
