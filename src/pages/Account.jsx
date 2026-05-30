import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Shield, Bell, Zap, LogOut, Building2, Phone, Mail,
  Camera, Check, Eye, EyeOff, ChevronDown, ChevronUp, Key, Copy,
  Database, Download, Upload, Trash2
} from 'lucide-react'
import { useAuthStore, PLANS, ROLES } from '@/store/useAuthStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { clearAccountData, exportAccountBackup, importAccountBackup } from '@/services/accountDataService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className={clsx('relative w-10 h-5 rounded-full transition-colors shrink-0', checked ? 'bg-brand-600' : 'bg-surface-500')}>
      <motion.span 
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" 
      />
    </button>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08 } 
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
}

// ── Collapsible section ───────────────────────────────────────
function Section({ icon: Icon, title, desc, children, defaultOpen = false, variants }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <motion.div variants={variants} className="bg-surface-800 border border-subtle rounded-3xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-5 hover:bg-surface-700/40 transition-colors">
        <div className="p-2 rounded-xl bg-surface-700 text-muted-400 shrink-0"><Icon size={16} /></div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-brand-600 dark:text-white">{title}</p>
          <p className="text-xs text-muted-400">{desc}</p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ChevronDown size={15} className="text-muted-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-5 border-t border-subtle space-y-4 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs text-muted-400 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────
function ProfileSection({ user, updateProfile, variants }) {
  const [name, setName]     = useState(user?.name || '')
  const [phone, setPhone]   = useState(user?.phone || '')
  const [company, setCompany] = useState(user?.companyName || '')
  const [logo, setLogo]     = useState(user?.companyLogo || null)
  const fileRef = useRef()
  const [saving, setSaving] = useState(false)

  const handleLogo = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(ev.target.result)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    updateProfile({ name, phone, companyName: company, companyLogo: logo })
    setSaving(false)
    toast.success('Perfil actualizado')
  }

  return (
    <Section icon={User} title="Perfil de usuario" desc="Nombre, foto y datos de contacto" defaultOpen variants={variants}>
      {/* Avatar / Logo */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-white">{name?.charAt(0)?.toUpperCase() || 'K'}</span>}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center shadow-lg hover:bg-brand-500 transition-colors">
            <Camera size={11} className="text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-600 dark:text-white">{user?.name || '—'}</p>
          <p className="text-xs text-muted-400">{user?.email}</p>
          <button onClick={() => fileRef.current?.click()} className="text-[11px] text-brand-400 hover:text-brand-300 mt-1">Cambiar foto/logo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre completo *" value={name} onChange={setName} placeholder="Ej: Juan Pérez" />
        <Field label="Teléfono" value={phone} onChange={setPhone} placeholder="Ej: +57 300..." />
        <Field label="Empresa" value={company} onChange={setCompany} placeholder="Nombre de tu negocio" />
        <div>
          <label className="text-xs text-muted-400 mb-1 block">Correo electrónico</label>
          <input value={user?.email || ''} disabled
            className="w-full bg-surface-600 border border-subtle rounded-xl px-4 py-2.5 text-sm text-muted-400 cursor-not-allowed" />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
        {saving ? 'Guardando...' : <><Check size={14} /> Guardar cambios</>}
      </button>
    </Section>
  )
}

// ── Security section ──────────────────────────────────────────
function SecuritySection({ user, updateProfile, variants }) {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow]       = useState(false)
  const [twoFA, setTwoFA]     = useState(false)
  const [codes, setCodes]     = useState(null)
  const [saving, setSaving]   = useState(false)

  const changePassword = async () => {
    if (next.length < 6)            return toast.error('Mínimo 6 caracteres')
    if (next !== confirm)           return toast.error('Las contraseñas no coinciden')
    setSaving(true)
    
    // Reauthenticate in Supabase
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: current
    })

    if (authError) {
      setSaving(false)
      return toast.error('Contraseña actual incorrecta')
    }

    // Update password in Supabase
    const { error: updateError } = await supabase.auth.updateUser({ password: next })
    setSaving(false)

    if (updateError) {
      return toast.error('Error al actualizar la contraseña: ' + updateError.message)
    }

    setCurrent(''); setNext(''); setConfirm('')
    toast.success('Contraseña actualizada')
  }

  const generateBackupCodes = () => {
    const c = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 8).toUpperCase())
    setCodes(c)
    toast('Guarda estos códigos en un lugar seguro', { icon: '🔐' })
  }

  const pwInput = (label, value, onChange) => (
    <div className="relative">
      <label className="text-xs text-muted-400 mb-1 block">{label}</label>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder="••••••••"
        className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 bottom-2.5 text-muted-400">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )

  return (
    <Section icon={Shield} title="Seguridad" desc="Contraseña, 2FA y sesiones activas" variants={variants}>
      <p className="text-xs font-medium text-muted-400 uppercase tracking-wide">Cambiar contraseña</p>
      <div className="space-y-3">
        {pwInput('Contraseña actual', current, setCurrent)}
        {pwInput('Nueva contraseña', next, setNext)}
        {pwInput('Confirmar nueva contraseña', confirm, setConfirm)}
      </div>
      <button onClick={changePassword} disabled={saving || !current || !next || !confirm}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
        <Key size={14} /> {saving ? 'Guardando...' : 'Actualizar contraseña'}
      </button>

      {/* 2FA */}
      <div className="border-t border-subtle pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Autenticación de dos factores (2FA)</p>
            <p className="text-xs text-muted-400">Añade una capa extra de seguridad a tu cuenta</p>
          </div>
          <Toggle checked={twoFA} onChange={(v) => { setTwoFA(v); toast(v ? '2FA activado (simulado)' : '2FA desactivado', { icon: v ? '✅' : '🔓' }) }} />
        </div>
        {twoFA && (
          <div className="space-y-2">
            <button onClick={generateBackupCodes} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <Key size={11} /> Generar códigos de respaldo
            </button>
            {codes && (
              <div className="bg-surface-900 border border-brand-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-muted-400 font-medium">Códigos de respaldo</p>
                  <button onClick={() => { navigator.clipboard.writeText(codes.join('\n')); toast('Copiados', { icon: '📋' }) }}
                    className="text-[11px] text-brand-400 flex items-center gap-1"><Copy size={10} /> Copiar</button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {codes.map(c => <span key={c} className="font-mono text-[11px] text-foreground bg-surface-700 px-2 py-1 rounded text-center">{c}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session info */}
      <div className="border-t border-subtle pt-4">
        <p className="text-xs font-medium text-muted-400 uppercase tracking-wide mb-2">Sesión activa</p>
        <div className="flex items-center gap-3 bg-surface-700 rounded-xl p-3">
          <div className="w-2 h-2 rounded-full bg-success-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium">Dispositivo actual</p>
            <p className="text-[11px] text-muted-400">Navegador web · {new Date().toLocaleDateString('es-CO')}</p>
          </div>
          <span className="text-[10px] bg-success-900/30 text-success-400 px-2 py-0.5 rounded-full">Activa</span>
        </div>
      </div>
    </Section>
  )
}

// ── Notifications section ─────────────────────────────────────
function NotificationsSection({ variants }) {
  const notifications    = useSettingsStore((s) => s.notifications)
  const setNotification  = useSettingsStore((s) => s.setNotification)

  const items = [
    { key: 'invoicePaid',    label: 'Factura pagada',      desc: 'Cuando un cliente marca una factura como pagada' },
    { key: 'invoiceOverdue', label: 'Factura vencida',     desc: 'Alertas de facturas con más de X días sin pago' },
    { key: 'lowStock',       label: 'Stock bajo',          desc: 'Cuando un producto cae por debajo del mínimo' },
    { key: 'newClient',      label: 'Nuevo cliente',       desc: 'Al registrar un nuevo cliente en el sistema' },
    { key: 'weeklyReport',   label: 'Reporte semanal',     desc: 'Resumen de ventas cada lunes por correo' },
    { key: 'pushEnabled',    label: 'Notificaciones push', desc: 'Alertas en tiempo real en el navegador' },
  ]

  return (
    <Section icon={Bell} title="Notificaciones" desc="Email, push y recordatorios de cobro" variants={variants}>
      <div className="space-y-1">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2.5 border-b border-subtle last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-[11px] text-muted-400">{desc}</p>
            </div>
            <Toggle checked={!!notifications[key]} onChange={async (v) => {
              if (key === 'pushEnabled' && v) {
                if (!('Notification' in window)) {
                  toast.error('Este navegador no soporta notificaciones de escritorio')
                  return
                }
                const perm = await Notification.requestPermission()
                if (perm !== 'granted') {
                  toast.error('Permiso de notificaciones denegado')
                  return
                }
              }
              setNotification(key, v)
              toast(v ? `${label} activado` : `${label} desactivado`, { icon: v ? '🔔' : '🔕', duration: 1500 })
            }} />
          </div>
        ))}
      </div>
    </Section>
  )
}

// ── Main Account page ─────────────────────────────────────────
function DataManagementSection({ user, variants }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const isAdmin = user?.role === 'administrador'

  const run = async (action, successMessage) => {
    try {
      setBusy(true)
      await action()
      toast.success(successMessage)
    } catch (err) {
      toast.error(err.message || 'No se pudo completar la accion')
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.confirm('Importar este backup reemplazara los datos actuales de gestion. Continua solo si ya tienes una copia segura.')) return
    await run(() => importAccountBackup(file), 'Backup importado')
  }

  const handleClear = async () => {
    if (!window.confirm('Esta accion borrara productos, clientes, facturas, abonos, egresos, notificaciones, bolsillos y prestamos personales. No elimina tu usuario ni tu empresa. Deseas continuar?')) return
    if (window.prompt('Escribe ELIMINAR para confirmar') !== 'ELIMINAR') return toast.error('Confirmacion cancelada')
    await run(clearAccountData, 'Datos de gestion eliminados')
  }

  return (
    <Section icon={Database} title="Datos y respaldo" desc="Backup Excel, importacion y limpieza de informacion" variants={variants}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => run(exportAccountBackup, 'Backup generado')}
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-surface-700 hover:bg-surface-600 disabled:opacity-50 border border-subtle text-foreground text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
        >
          <Download size={15} /> Generar Backup
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || !isAdmin}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
        >
          <Upload size={15} /> Importar Backup
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      </div>

      <div className="border-t border-subtle pt-4">
        <button
          type="button"
          onClick={handleClear}
          disabled={busy || !isAdmin}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-danger-500/25 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500/50 disabled:opacity-40 transition-all text-sm font-bold"
        >
          <Trash2 size={15} /> Eliminar todos los datos de gestion
        </button>
        {!isAdmin && (
          <p className="text-[11px] text-muted-400 mt-2 text-center">Solo el administrador puede importar o eliminar datos.</p>
        )}
      </div>
    </Section>
  )
}

export default function Account() {
  const user         = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout       = useAuthStore((s) => s.logout)
  const navigate     = useNavigate()

  const planInfo = PLANS[user?.plan] || PLANS.standard
  const roleInfo = ROLES[user?.role] || ROLES.administrador
  const initial  = user?.name?.charAt(0)?.toUpperCase() || 'K'

  const handleLogout = () => { logout(); toast.success('Sesión cerrada'); navigate('/auth') }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container max-w-2xl space-y-5"
    >
      <motion.div 
        variants={itemVariants}
        className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle"
      >
        <h1 className="text-xl md:text-2xl font-bold text-brand-600 dark:text-white">Cuenta</h1>
        <p className="hidden sm:block text-sm text-muted-400 mt-0.5">Perfil y configuración de usuario</p>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={itemVariants}
        className="bg-surface-800 border border-subtle rounded-3xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-surface-700 shadow-sm">
          {user?.avatarUrl && user.avatarUrl.startsWith('color:') ? (
            <div 
              style={{ backgroundColor: user.avatarUrl.replace('color:', '') }}
              className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
            >
              {initial}
            </div>
          ) : user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : user?.companyLogo ? (
            <img src={user.companyLogo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl font-bold text-white">
              {initial}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-brand-600 dark:text-white truncate">{user?.name || 'Usuario'}</p>
          <p className="text-sm text-muted-400 truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] bg-brand-600/20 text-brand-300 border border-brand-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <Zap size={10} /> Plan {planInfo.name}
            </span>
            <span className="text-[10px] bg-surface-600 text-muted-400 border border-subtle px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              {roleInfo.label}
            </span>
          </div>
        </div>
      </motion.div>

      <ProfileSection      user={user} updateProfile={updateProfile} variants={itemVariants} />
      <SecuritySection     user={user} updateProfile={updateProfile} variants={itemVariants} />
      <NotificationsSection variants={itemVariants} />
      <DataManagementSection user={user} variants={itemVariants} />

      <motion.button 
        variants={itemVariants}
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-danger-500/20 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500/40 transition-all text-sm font-bold"
      >
        <LogOut size={16} /> Cerrar sesión
      </motion.button>
    </motion.div>
  )
}
