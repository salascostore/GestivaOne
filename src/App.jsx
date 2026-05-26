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
import Landing from '@/pages/Landing'
import Notifications from '@/pages/Notifications'
import Terms from '@/pages/Terms'
import Facturero from '@/pages/Facturero'
import DianAssistant from '@/pages/DianAssistant'
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
  const initialized = useAuthStore((s) => s.initialized)

  const location = useLocation()

  useEffect(() => {
    const CURRENT_VERSION = '2.3'
    const lastVersion = localStorage.getItem('gestiva-app-version')
    const hasVersionChanged = lastVersion !== CURRENT_VERSION

    const ACTIVE_KEYS = [
      'gestiva-app-version',
      'gestiva-auth-v2.2',
      'gestiva-currency-v2',
      'gestiva-expenses-v2',
      'gestiva-notifications',
      'gestiva-settings-v2.3',
      'gestiva-ui',
      'gestiva-cookies-accepted'
    ]

    // If version changed, perform a full purge of all non-essential data
    if (hasVersionChanged) {
      console.log(`🧹 New version detected (${CURRENT_VERSION})! Purging old persisted caches...`)
      
      // Clear active keys too to force a complete reset of store states to avoid mismatches
      const keysToForceClear = [
        'gestiva-auth-v2.2',
        'gestiva-settings-v2.3',
        'gestiva-notifications',
        'gestiva-expenses-v2',
        'gestiva-currency-v2',
        'gestiva-ui',
        'gestiva-cookies-accepted'
      ]
      keysToForceClear.forEach(k => localStorage.removeItem(k))
    }

    // Clean up any remaining/legacy keys starting with 'gestiva-'
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('gestiva-') && !ACTIVE_KEYS.includes(key)) {
          console.log(`🧹 Purging legacy cache key: ${key}`)
          localStorage.removeItem(key)
          i--
        }
      }
    } catch (e) {
      console.error('Error cleaning legacy localStorage:', e)
    }

    // Clear CacheStorage (browser cache buckets)
    if (window.caches) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          console.log(`🧹 Deleting browser cache bucket: ${key}`)
          caches.delete(key)
        })
      }).catch(err => console.error('Error clearing CacheStorage:', err))
    }

    // Unregister legacy Service Workers
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log(`🧹 Unregistering Service Worker:`, registration)
          registration.unregister()
        })
      }).catch(err => console.error('Error unregistering ServiceWorkers:', err))
    }

    if (hasVersionChanged) {
      localStorage.setItem('gestiva-app-version', CURRENT_VERSION)
      window.location.reload()
    }
  }, [])

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
    '/notifications': 'Notificaciones',
    '/terms': 'Términos',
    '/facturero': 'Facturero',
    '/dian': 'Asistente DIAN'
  }

  useEffect(() => {
    if (location.pathname === '/auth') {
      document.documentElement.classList.remove('dark')
    } else {
      applyTheme(theme)
      if (theme === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme('system')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
      }
    }
  }, [theme, location.pathname])

  useEffect(() => {
    const pageTitle = (location.pathname === '/' && !isAuthenticated)
      ? 'Inicio'
      : (pageTitles[location.pathname] || 'GestivaOne')
    const originalTitle = `GO | ${pageTitle}`
    const attentionTitle = '¡Tienes una factura pendiente! 📄'
    
    document.title = originalTitle

    const handleVisibility = () => {
      document.title = document.hidden ? attentionTitle : originalTitle
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [location.pathname, isAuthenticated])

  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/auth') {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, location.pathname, navigate])

  useEffect(() => { initAuth() }, [])
  useEffect(() => { if (isStale()) fetchRates() }, [])
  useEffect(() => { checkOverdue() }, [])

  if (!initialized) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#120a2b] via-[#1b0d3d] to-[#0b051b] text-white">
        <div className="relative flex flex-col items-center">
          {/* Glowing Aura Effect */}
          <div className="absolute w-[200px] h-[200px] bg-brand-500/10 rounded-full blur-[60px] animate-pulse" />
          
          {/* Animated Logo Container */}
          <div className="relative z-10 flex items-center justify-center w-24 h-24 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-bounce [animation-duration:3s]">
            <svg 
              className="w-12 h-12 text-brand-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Glowing text logo */}
          <h1 className="mt-8 text-2xl font-black tracking-widest text-white uppercase select-none">
            GESTIVA <span className="text-brand-400">ONE</span>
          </h1>

          {/* Subtitle / Phrase with pulse animation */}
          <p className="mt-4 px-6 text-center text-sm font-semibold tracking-wider text-brand-300/80 animate-pulse [animation-duration:2.5s] max-w-[320px]">
            Estamos trabajando para darte una mejor experiencia
          </p>

          {/* Minimalist Spinner */}
          <div className="mt-12 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Landing/Home Route (Conditional layout wrapper) */}
        <Route 
          path="/" 
          element={isAuthenticated ? <AppLayout /> : <Landing />}
        >
          <Route index element={<Dashboard />} />
        </Route>

        {/* Public Route */}
        <Route 
          path="/auth" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} 
        />
        <Route path="/terms" element={<Terms />} />

        {/* Protected Routes */}
        <Route
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/auth" replace />}
        >
          <Route path="/menu" element={<RequirePermission perm="menu"><Menu /></RequirePermission>} />
          <Route path="/products" element={<RequirePermission perm="products"><Products /></RequirePermission>} />
          <Route path="/employees" element={<RequirePermission perm="employees"><Employees /></RequirePermission>} />
          <Route path="/settings" element={<RequirePermission perm="settings"><Settings /></RequirePermission>} />
          <Route path="/account" element={<Account />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/facturero" element={<RequirePermission perm="dashboard"><Facturero /></RequirePermission>} />
          <Route path="/dian" element={<RequirePermission perm="dashboard"><DianAssistant /></RequirePermission>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <CookieBanner />
      <CountrySelectorModal />
      <Analytics />
    </>
  )
}
