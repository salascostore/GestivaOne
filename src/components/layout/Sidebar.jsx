import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, UtensilsCrossed, Package,
  Settings, User, ChevronLeft, Zap, X, Users, Lock
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore, ROLES } from '@/store/useAuthStore'
import clsx from 'clsx'
import GestivaLogo from '@/components/ui/GestivaLogo'

export default function Sidebar({ isMobile }) {
  const collapsed      = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar  = useUIStore((s) => s.toggleSidebar)
  const mobileOpen     = useUIStore((s) => s.mobileSidebarOpen)
  const closeMobile    = useUIStore((s) => s.closeMobileSidebar)
  const user           = useAuthStore((s) => s.user)
  const location       = useLocation()

  const role        = user?.role || 'despachador'
  const permissions = ROLES[role]?.permissions || {}

  const NAV = [
    { to: '/',          icon: LayoutDashboard, label: 'Dashboard',    perm: 'dashboard'  },
    { to: '/menu',      icon: UtensilsCrossed, label: 'Menú',         perm: 'menu'       },
    { to: '/products',  icon: Package,         label: 'Productos',    perm: 'products'   },
    { to: '/employees', icon: Users,           label: 'Empleados',    perm: 'employees'  },
    { to: '/settings',  icon: Settings,        label: 'Configuración',perm: 'settings'   },
    { to: '/account',   icon: User,            label: 'Cuenta',       perm: 'account'    },
  ]

  const handleNavClick = () => { if (isMobile) closeMobile() }

  // ── Logo / Brand header ───────────────────────────────────
  const BrandHeader = ({ showText }) => (
    <div className={clsx('flex items-center gap-3 px-4 h-16 border-b border-subtle shrink-0', !showText && 'justify-center px-0')}>
      {user?.companyLogo
        ? <img src={user.companyLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover shrink-0" />
        : (
          <GestivaLogo className="w-10 h-10 shrink-0" />
        )
      }
      {showText && (
        <div className="flex flex-col leading-tight overflow-hidden whitespace-nowrap">
          <span className="text-[14px] font-bold text-white uppercase tracking-wider truncate max-w-[130px]" title={user?.companyName || 'Mi Empresa'}>
            {user?.companyName || 'Mi Empresa'}
          </span>
          <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase mt-0.5">
            Gestiva <span className="font-extrabold">One</span>
          </span>
        </div>
      )}
    </div>
  )

  // ── Nav link ──────────────────────────────────────────────
  const NavItem = ({ to, icon: Icon, label, perm, layoutId }) => {
    const isActive   = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
    const allowed    = permissions[perm] ?? true

    return (
      <motion.div 
        layout
        initial={false}
        className="relative"
      >
        <NavLink
          to={allowed ? to : '#'}
          onClick={allowed ? handleNavClick : (e) => e.preventDefault()}
          target="_self"
          className={clsx(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
            !allowed && 'opacity-50 cursor-not-allowed',
            isActive && allowed ? 'text-brand-300'
              : allowed ? 'text-muted-400 hover:text-white hover:bg-surface-600'
              : 'text-muted-400'
          )}
          title={collapsed ? label : undefined}
        >
          {isActive && allowed && (
            <motion.div 
              layoutId={layoutId}
              className="absolute inset-0 rounded-xl bg-brand-600/20 border border-brand-500/30"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Icon size={18} className="shrink-0 relative z-10" />
          <AnimatePresence mode="popLayout">
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="relative z-10 whitespace-nowrap overflow-hidden flex-1"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {!allowed && !collapsed && <Lock size={12} className="text-muted-400 relative z-10 ml-auto" />}
          {!allowed && collapsed && <Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-muted-400" />}
        </NavLink>
      </motion.div>
    )
  }

  // ── MOBILE drawer ─────────────────────────────────────────
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMobile} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <motion.aside key="drawer" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface-800 border-r border-subtle flex flex-col shadow-modal">
              <div className="flex items-center justify-between px-4 h-16 border-b border-subtle shrink-0">
                <div className="flex items-center gap-3">
                  {user?.companyLogo
                    ? <img src={user.companyLogo} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    : <GestivaLogo className="w-10 h-10 shrink-0" />
                  }
                  <div className="flex flex-col leading-tight overflow-hidden whitespace-nowrap">
                    <span className="text-[14px] font-bold text-white uppercase tracking-wider truncate max-w-[130px]" title={user?.companyName || 'Mi Empresa'}>
                      {user?.companyName || 'Mi Empresa'}
                    </span>
                    <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase mt-0.5">
                      Gestiva <span className="font-extrabold">One</span>
                    </span>
                  </div>
                </div>
                <button onClick={closeMobile} className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-600 transition-colors"><X size={16} /></button>
              </div>
              <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {NAV.map(({ to, icon: Icon, label, perm }, i) => {
                  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                  const allowed  = permissions[perm] ?? true
                  return (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <NavLink to={allowed ? to : '#'}
                        onClick={allowed ? handleNavClick : (e) => e.preventDefault()}
                        target="_self"
                        className={clsx(
                          'relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                          !allowed && 'opacity-50 cursor-not-allowed',
                          isActive && allowed ? 'text-brand-300' : allowed ? 'text-muted-400 hover:text-white hover:bg-surface-600' : 'text-muted-400'
                        )}>
                        {isActive && allowed && <motion.div layoutId="activeIndicatorMobile"
                          className="absolute inset-0 rounded-xl bg-brand-600/20 border border-brand-500/30"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
                        <Icon size={18} className="shrink-0 relative z-10" />
                        <span className="relative z-10 flex-1">{label}</span>
                        {!allowed && <Lock size={12} className="text-muted-400 relative z-10" />}
                      </NavLink>
                    </motion.div>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  // ── DESKTOP collapsible sidebar ───────────────────────────
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="relative h-screen bg-surface-800 border-r border-subtle flex flex-col overflow-hidden shrink-0 z-10"
    >
      <AnimatePresence>
        {!collapsed
          ? <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BrandHeader showText={true} /></motion.div>
          : <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BrandHeader showText={false} /></motion.div>
        }
      </AnimatePresence>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {NAV.map(({ to, icon, label, perm }) => (
          <NavItem key={to} to={to} icon={icon} label={label} perm={perm} layoutId="activeIndicator" />
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-subtle">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white shadow-glow-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'G'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Invitado'}</p>
                <p className="text-[10px] text-brand-400 font-medium uppercase tracking-widest mt-0.5">
                  {ROLES[user?.role]?.label || 'Usuario'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-2 border-t border-subtle shrink-0">
        <button onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-xl text-muted-400 hover:text-white hover:bg-surface-600 transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}>
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  )
}
