import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Receipt, Package,
  Settings, ChevronLeft, X, Users, Lock, Bell, Printer, Calculator, Wallet, FolderClosed, Contact, Mail,
  User, CreditCard, LogOut, HelpCircle, MessageSquare, Zap
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore, ROLES } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import clsx from 'clsx'

const AVATAR_SIZE = 44

export default function Sidebar({ isMobile }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen)
  const closeMobile = useUIStore((s) => s.closeMobileSidebar)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  
  const unreadCount = useNotificationStore((s) => s.getUnreadCount())
  
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef(null)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    setShowProfileMenu(false)
    await logout()
  }
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)

  const role = user?.role || 'despachador'
  const permissions = ROLES[role]?.permissions || {}

  useEffect(() => {
    if (!user?.companyId) return

    fetchNotifications()

    const channel = supabase.channel('realtime:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `company_id=eq.${user.companyId}` 
      }, () => {
        // Fetch fresh notifications instantly
        fetchNotifications(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.companyId])

  const renderAvatar = () => {
    const initial = user?.name?.charAt(0).toUpperCase() || 'G'
    const baseClass = 'rounded-full border border-surface-600 shrink-0 shadow-sm'
    const style = { width: AVATAR_SIZE, height: AVATAR_SIZE, objectFit: 'cover' }

    if (user?.avatarUrl?.startsWith('color:')) {
      const color = user.avatarUrl.replace('color:', '')
      return (
        <div
          style={{ ...style, backgroundColor: color }}
          className={`${baseClass} flex items-center justify-center text-base font-bold text-white`}
        >
          {initial}
        </div>
      )
    }
    if (user?.avatarUrl) {
      return <img src={user.avatarUrl} alt="" style={style} className={baseClass} />
    }
    if (user?.companyLogo) {
      return <img src={user.companyLogo} alt="" style={style} className={baseClass} />
    }
    return (
      <div
        style={style}
        className={`${baseClass} bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-base font-bold text-white`}
      >
        {initial}
      </div>
    )
  }

  const NAV_GROUPS = [
    {
      title: 'Operaciones',
      items: [
        { to: '/menu', icon: Receipt, label: 'Menú', perm: 'menu' },
        { to: '/products', icon: Package, label: 'Productos', perm: 'products' },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', perm: 'dashboard' },
        { to: '/employees', icon: Users, label: 'Empleados', perm: 'employees' },
        { to: '/pockets', icon: FolderClosed, label: 'Bolsillos', perm: 'dashboard' },
        { to: '/crm', icon: Contact, label: 'CRM', perm: 'dashboard' },
        { to: '/emails', icon: Mail, label: 'Emails', perm: 'dashboard' },
        { to: '/personal-finance', icon: Wallet, label: 'Mi Gestión', perm: 'account' },
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { to: '/facturero', icon: Printer, label: 'Facturero', perm: 'dashboard' },
        { to: '/dian', icon: Calculator, label: 'Asistente DIAN', perm: 'dashboard' },
        { to: '/seguridad', icon: Lock, label: 'GestiToken', perm: 'dashboard' },
      ]
    }
  ]

  const handleNavClick = () => { if (isMobile) closeMobile() }

  // ── Nav link (desktop) ──────────────────────────────────────
  // IMPORTANT: Icon must NEVER shift. We use a fixed-width row:
  //   [px-3] [18px icon] [label animates width 0→auto without pushing icon]
  const NavItem = ({ to, icon: Icon, label, perm }) => {
    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
    const allowed = permissions[perm] ?? true

    return (
      <NavLink
        to={allowed ? to : '#'}
        onClick={allowed ? handleNavClick : (e) => e.preventDefault()}
        target="_self"
        title={label}
        className={clsx(
          // Fixed height + padding, NO gap — label is handled separately
          'relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200',
          !allowed && 'opacity-50 cursor-not-allowed',
          isActive && allowed
            ? 'text-brand-300'
            : allowed
            ? 'text-muted-400 hover:text-white hover:bg-surface-600'
            : 'text-muted-400'
        )}
      >
        {/* Active highlight pill — never moves */}
        {isActive && allowed && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 rounded-xl bg-brand-600/20 border border-brand-500/30"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {/* Icon — FIXED, never moves regardless of label state */}
        <div className="relative z-10 shrink-0 w-[18px] h-[18px] flex items-center justify-center">
          <Icon size={18} />
          {label === 'Notificaciones' && unreadCount > 0 && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border border-surface-800" />
          )}
        </div>

        {/* Label — animates width without pushing the icon */}
        <div className="overflow-hidden relative z-10 flex-1 flex items-center justify-between">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="block pl-3 whitespace-nowrap flex-1"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Lock / Notification badges on collapsed */}
        {!allowed && !collapsed && <Lock size={12} className="text-muted-400 relative z-10 ml-2" />}
        {!allowed && collapsed && <Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-muted-400" />}
      </NavLink>
    )
  }

  // ── MOBILE drawer ─────────────────────────────────────────
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="sidebar-premium-dark fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface-800 border-r border-subtle flex flex-col shadow-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-20 border-b border-subtle shrink-0">
                <div className="flex flex-col leading-tight overflow-hidden whitespace-nowrap">
                  <span className="text-[16px] font-black text-white uppercase tracking-wide truncate max-w-[180px]" title={user?.companyName || 'Mi Empresa'}>
                    {user?.companyName || 'Mi Empresa'}
                  </span>
                  <span className="text-[10.5px] text-brand-400 font-bold tracking-widest uppercase mt-0.5">
                    Gestiva One
                  </span>
                </div>
                <button onClick={closeMobile} className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {NAV_GROUPS.map((group, gIdx) => (
                  <div key={group.title} className="flex flex-col gap-1 mb-3">
                    <div className="uppercase text-[9px] font-black text-muted-500 tracking-wider px-3 mb-1 mt-2 first:mt-0 select-none">
                      {group.title}
                    </div>
                    {group.items.map(({ to, icon: Icon, label, perm }, i) => {
                      const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                      const allowed = permissions[perm] ?? true
                      return (
                        <motion.div
                          key={to}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (gIdx * 2 + i) * 0.05 }}
                        >
                          <NavLink
                            to={allowed ? to : '#'}
                            onClick={allowed ? handleNavClick : (e) => e.preventDefault()}
                            target="_self"
                            className={clsx(
                              'relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                              !allowed && 'opacity-50 cursor-not-allowed',
                              isActive && allowed ? 'text-brand-300' : allowed ? 'text-muted-400 hover:text-white hover:bg-surface-600' : 'text-muted-400'
                            )}
                          >
                            {isActive && allowed && (
                              <motion.div
                                layoutId="activeIndicatorMobile"
                                className="absolute inset-0 rounded-xl bg-brand-600/20 border border-brand-500/30"
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                              />
                            )}
                            <div className="relative shrink-0 w-[18px] h-[18px] flex items-center justify-center z-10">
                              <Icon size={18} />
                              {label === 'Notificaciones' && unreadCount > 0 && (
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border border-surface-800" />
                              )}
                            </div>
                            <span className="relative z-10 flex-1">
                              {label}
                            </span>
                            {!allowed && <Lock size={12} className="text-muted-400 relative z-10" />}
                          </NavLink>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}

                {/* Notifications at bottom */}
                <div className="mt-auto pt-2 border-t border-subtle shrink-0 flex flex-col gap-1">
                  <NavLink
                    to={permissions['dashboard'] ? '/notifications' : '#'}
                    onClick={permissions['dashboard'] ? handleNavClick : (e) => e.preventDefault()}
                    target="_self"
                    className={clsx(
                      'relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                      !permissions['dashboard'] && 'opacity-50 cursor-not-allowed',
                      location.pathname.startsWith('/notifications') && permissions['dashboard']
                        ? 'text-brand-300'
                        : permissions['dashboard']
                        ? 'text-muted-400 hover:text-white hover:bg-surface-600'
                        : 'text-muted-400'
                    )}
                  >
                    {location.pathname.startsWith('/notifications') && permissions['dashboard'] && (
                      <motion.div
                        layoutId="activeIndicatorMobile"
                        className="absolute inset-0 rounded-xl bg-brand-600/20 border border-brand-500/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <div className="relative shrink-0 w-[18px] h-[18px] flex items-center justify-center z-10">
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border border-surface-800" />
                      )}
                    </div>
                    <span className="relative z-10 flex-1">Notificaciones</span>
                    {!permissions['dashboard'] && <Lock size={12} className="text-muted-400 relative z-10" />}
                  </NavLink>
                </div>
              </nav>

              {/* User Profile */}
              <div ref={profileRef} className="relative block p-4 border-t border-subtle bg-surface-900/40 shrink-0">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-full flex items-center gap-3 text-left focus:outline-none hover:bg-surface-800/40 p-2 rounded-xl transition-colors"
                >
                  {renderAvatar()}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Invitado'}</p>
                    <p className="text-[10px] text-brand-400 font-medium uppercase tracking-widest mt-0.5">
                      {ROLES[user?.role]?.label || 'Usuario'}
                    </p>
                  </div>
                </button>

                {/* Profile Dropdown Menu in Mobile */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute bottom-16 left-4 right-4 z-50 bg-surface-800 border border-subtle shadow-2xl rounded-2xl p-1.5 flex flex-col gap-0.5 text-neutral-200"
                    >
                      <NavLink
                        to="/account"
                        onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
                      >
                        <User size={15} className="text-muted-400" />
                        <span>Profile</span>
                      </NavLink>

                      <NavLink
                        to="/crm"
                        onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
                      >
                        <MessageSquare size={15} className="text-muted-400" />
                        <span>Community</span>
                      </NavLink>

                      <NavLink
                        to="/account"
                        onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard size={15} className="text-muted-400" />
                          <span>Subscription</span>
                        </div>
                        <div className="flex items-center gap-0.5 bg-brand-600/20 border border-brand-500/30 text-brand-300 font-bold px-1.5 py-0.5 rounded text-[9px] tracking-wide shrink-0">
                          <Zap size={8} className="fill-current text-brand-400" />
                          {user?.plan === 'empresarial' ? '360' : 'PRO'}
                        </div>
                      </NavLink>

                      <NavLink
                        to="/settings"
                        onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
                      >
                        <Settings size={15} className="text-muted-400" />
                        <span>Settings</span>
                      </NavLink>

                      <div className="border-t border-subtle/50 my-1.5 mx-1" />

                      <a
                        href="mailto:soporte@gestivaone.com?subject=Soporte%20GestivaOne"
                        onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
                      >
                        <HelpCircle size={15} className="text-muted-400" />
                        <span>Help center</span>
                      </a>

                      <button
                        onClick={() => { handleLogout(); closeMobile(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-danger-400 hover:bg-danger-950/20 transition-colors text-left"
                      >
                        <LogOut size={15} className="text-danger-500" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  // ── DESKTOP collapsible sidebar ────────────────────────────
  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="sidebar-premium-dark relative h-screen bg-surface-800 border-r border-subtle flex flex-col shrink-0 z-30"
    >
      {/* Brand header — always same height, icon stays, text slides */}
      <div className="flex items-center px-4 h-20 border-b border-subtle shrink-0 overflow-hidden">
        {/* Fixed brand icon/initial */}
        <div className="shrink-0 w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mr-3">
          <span className="text-xs font-black text-brand-400 uppercase leading-none">
            {(user?.companyName || 'G').charAt(0)}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="brand-text"
              initial={{ opacity: 0, x: -12, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -12, width: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="flex flex-col leading-tight overflow-hidden whitespace-nowrap"
            >
              <span
                className="text-[15px] font-black text-foreground uppercase tracking-wide truncate max-w-[130px]"
                title={user?.companyName || 'Mi Empresa'}
              >
                {user?.companyName || 'Mi Empresa'}
              </span>
              <span className="text-[10px] text-brand-400 font-bold tracking-widest uppercase mt-0.5">
                GestivaOne
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.title} className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.div
                  key="group-label"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="uppercase text-[9px] font-black text-muted-500 tracking-wider px-3 mb-1.5 mt-3.5 first:mt-0 select-none overflow-hidden"
                >
                  {group.title}
                </motion.div>
              ) : gIdx > 0 ? (
                <motion.div
                  key="divider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-t border-subtle/40 my-2 mx-2"
                />
              ) : null}
            </AnimatePresence>

            {group.items.map(({ to, icon, label, perm }) => (
              <NavItem key={to} to={to} icon={icon} label={label} perm={perm} />
            ))}
          </div>
        ))}
      </nav>

      {/* Notifications */}
      <div className="px-2 py-1.5 border-t border-subtle shrink-0 flex flex-col gap-1">
        <NavItem to="/notifications" icon={Bell} label="Notificaciones" perm="dashboard" />
      </div>

      {/* User Profile — avatar always same size */}
      <div ref={profileRef} className="relative block px-2 py-3 border-t border-subtle shrink-0">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-3 px-1 hover:bg-surface-700 p-2 rounded-xl transition-colors text-left focus:outline-none"
        >
          {/* Avatar — never changes size */}
          {renderAvatar()}

          {/* User info — slides in/out */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="flex-1 min-w-0 overflow-hidden whitespace-nowrap"
              >
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Invitado'}</p>
                <p className="text-[10px] text-brand-400 font-medium uppercase tracking-widest mt-0.5">
                  {ROLES[user?.role]?.label || 'Usuario'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Profile Dropdown Menu */}
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              className="absolute z-50 bg-surface-800 border border-subtle shadow-2xl rounded-2xl p-1.5 flex flex-col gap-0.5 text-neutral-200 min-w-[210px] bottom-2 left-full ml-3"
            >
              <NavLink
                to="/account"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
              >
                <User size={15} className="text-muted-400" />
                <span>Profile</span>
              </NavLink>

              <NavLink
                to="/crm"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
              >
                <MessageSquare size={15} className="text-muted-400" />
                <span>Community</span>
              </NavLink>

              <NavLink
                to="/account"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={15} className="text-muted-400" />
                  <span>Subscription</span>
                </div>
                <div className="flex items-center gap-0.5 bg-brand-600/20 border border-brand-500/30 text-brand-300 font-bold px-1.5 py-0.5 rounded text-[9px] tracking-wide shrink-0">
                  <Zap size={8} className="fill-current text-brand-400" />
                  {user?.plan === 'empresarial' ? '360' : 'PRO'}
                </div>
              </NavLink>

              <NavLink
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
              >
                <Settings size={15} className="text-muted-400" />
                <span>Settings</span>
              </NavLink>

              <div className="border-t border-subtle/50 my-1.5 mx-1" />

              <a
                href="mailto:soporte@gestivaone.com?subject=Soporte%20GestivaOne"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-muted-400 hover:text-white hover:bg-surface-700 transition-colors"
              >
                <HelpCircle size={15} className="text-muted-400" />
                <span>Help center</span>
              </a>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-danger-400 hover:bg-danger-950/20 transition-colors text-left"
              >
                <LogOut size={15} className="text-danger-500" />
                <span>Sign out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-subtle shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-xl text-muted-400 hover:text-white hover:bg-surface-600 transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  )
}
