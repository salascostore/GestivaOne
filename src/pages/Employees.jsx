import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Mail, Copy, RefreshCw, ShieldCheck, Truck, Calculator, Trash2, MoreVertical, Check, X, Clock } from 'lucide-react'
import { useEmployeeStore } from '@/store/useEmployeeStore'
import { ROLES } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_META = {
  administrador: { icon: ShieldCheck, color: 'text-brand-400',   bg: 'bg-brand-600/15   border-brand-500/30'  },
  despachador:   { icon: Truck,       color: 'text-warning-400', bg: 'bg-warning-900/20 border-warning-400/20' },
  contable:      { icon: Calculator,  color: 'text-success-400', bg: 'bg-success-900/20 border-success-400/20' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05 
    } 
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
}

// ── Code timer ────────────────────────────────────────────────
function CodeTimer({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return }
    const t = setInterval(() => {
      const r = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setRemaining(r)
      if (r <= 0) { clearInterval(t); onExpire() }
    }, 500)
    return () => clearInterval(t)
  }, [expiresAt])
  const pct = (remaining / 90) * 100
  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock size={12} className={remaining < 20 ? 'text-danger-400' : 'text-warning-400'} />
      <span className={remaining < 20 ? 'text-danger-400' : 'text-muted-400'}>{remaining}s</span>
      <div className="flex-1 h-1 bg-surface-600 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', remaining < 20 ? 'bg-danger-400' : 'bg-warning-400')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Add employee modal ─────────────────────────────────────────
function AddEmployeeModal({ open, onClose }) {
  const addEmployee = useEmployeeStore((s) => s.addEmployee)

  const [email, setEmail] = useState('')
  const [name, setName]   = useState('')
  const [role, setRole]   = useState('despachador')
  const [password, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name || !email) return toast.error('Completa los campos obligatorios')
    setLoading(true)
    try {
      const res = await addEmployee({ name, email: email.trim().toLowerCase(), role, password })
      if (res) {
        toast.success(`${name} añadido como ${ROLES[role].label}`)
        onClose()
        setEmail(''); setName(''); setPass('')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title="Añadir Colaborador" size="md">
      <div className="space-y-6">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-400 mb-1 block">Nombre del empleado *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: María Rodríguez"
              className="w-full bg-surface-600 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          <div>
            <label className="text-xs text-muted-400 mb-1 block">Correo electrónico *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="correo@empresa.com"
              className="w-full bg-surface-600 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          
          <div>
            <label className="text-xs text-muted-400 mb-2 block">Rol y permisos</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ROLES).map(([k, v]) => {
                if (k === 'administrador') return null
                const Icon = ROLE_META[k].icon
                return (
                  <button key={k} onClick={() => setRole(k)}
                    className={clsx('py-2.5 px-2 rounded-xl border-2 text-center transition-all',
                      role === k ? `border-brand-500 bg-brand-600/15` : 'border-subtle bg-surface-600 hover:border-surface-300')}>
                    <Icon size={16} className={clsx('mx-auto mb-1', role === k ? 'text-brand-300' : 'text-muted-400')} />
                    <p className={clsx('text-[11px] font-semibold', role === k ? 'text-white' : 'text-muted-400')}>{v.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-subtle text-muted-400 hover:text-white hover:bg-surface-600 text-sm font-semibold transition-all">
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-glow-sm transition-all disabled:opacity-50">
            {loading ? 'Guardando...' : 'Crear Cuenta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Role chip ──────────────────────────────────────────────────
function RoleChip({ role }) {
  const meta = ROLE_META[role] || ROLE_META.despachador
  const Icon = meta.icon
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', meta.color, meta.bg)}>
      <Icon size={9} /> {ROLES[role]?.label || role}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Employees() {
  const employees    = useEmployeeStore((s) => s.employees)
  const updateRole   = useEmployeeStore((s) => s.updateRole)
  const toggleActive = useEmployeeStore((s) => s.toggleActive)
  const removeEmployee = useEmployeeStore((s) => s.removeEmployee)
  const [modalOpen, setModalOpen] = useState(false)
  const [menuId, setMenuId] = useState(null)

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container space-y-5"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Empleados</h1>
          <p className="text-sm text-muted-400 mt-0.5">{employees.length} colaboradores registrados</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-glow-sm">
          <Plus size={15} /> Añadir
        </button>
      </motion.div>

      {employees.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center h-64 gap-4 text-center border-2 border-dashed border-subtle rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center">
            <Users size={28} className="text-muted-400" />
          </div>
          <div>
            <p className="text-white font-medium">Sin empleados aún</p>
            <p className="text-sm text-muted-400 mt-1">Añade colaboradores y asígnales roles.</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {employees.map((emp, i) => {
              const meta = ROLE_META[emp.role] || ROLE_META.despachador
              const Icon = meta.icon
              return (
                <motion.div 
                  key={emp.id} 
                  variants={itemVariants}
                  layout 
                  initial="hidden" 
                  animate="visible" 
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className={clsx(
                    'bg-surface-800 border rounded-3xl p-5 space-y-4 relative transition-colors duration-300',
                    emp.active ? 'border-subtle hover:border-brand-500/30' : 'border-danger-500/10 opacity-60 grayscale'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600/40 to-brand-800/40 flex items-center justify-center text-brand-300 font-bold text-sm shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
                      <p className="text-[11px] text-muted-400 truncate">{emp.email}</p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuId(menuId === emp.id ? null : emp.id)}
                        className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-600 transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {menuId === emp.id && (
                        <div className="absolute right-0 top-8 z-20 bg-surface-600 border border-subtle rounded-xl py-1 w-40 shadow-modal">
                          {Object.keys(ROLES).map((r) => (
                            <button key={r} onClick={() => { updateRole(emp.id, r); setMenuId(null) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-500 text-left transition-colors">
                              {emp.role === r && <Check size={10} className="text-brand-400" />}
                              <span className={emp.role === r ? 'text-brand-300 font-semibold' : 'text-muted-400'}>{ROLES[r].label}</span>
                            </button>
                          ))}
                          <div className="my-1 border-t border-subtle" />
                          <button onClick={() => { toggleActive(emp.id); setMenuId(null) }}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-surface-500 transition-colors text-muted-400">
                            {emp.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => { removeEmployee(emp.id); setMenuId(null) }}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-surface-500 transition-colors text-danger-400">
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <RoleChip role={emp.role} />
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', emp.active ? 'bg-success-900/30 text-success-400' : 'bg-danger-900/30 text-danger-400')}>
                      {emp.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-400">
                    Desde {new Date(emp.joinedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <AddEmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
