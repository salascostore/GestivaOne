import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Plus, ShieldCheck, Truck, Calculator, 
  Trash2, MoreVertical, Check, X, Clock, Copy, Link as LinkIcon 
} from 'lucide-react'
import { useEmployeeStore } from '@/store/useEmployeeStore'
import { useAuthStore, ROLES } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const ROLE_META = {
  administrador: { icon: ShieldCheck, color: 'text-brand-500',   bg: 'bg-brand-500/10 border-brand-500/25'  },
  despachador:   { icon: Truck,       color: 'text-warning-500', bg: 'bg-warning-500/10 border-warning-500/25' },
  contable:      { icon: Calculator,  color: 'text-success-500', bg: 'bg-success-500/10 border-success-500/25' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 } 
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

// ── Invitation Code Timer helper ───────────────────────────────────────────
function InviteTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(expiresAt) - new Date()
      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const isExpired = new Date(expiresAt) < new Date()

  return (
    <span className={clsx(
      "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
      isExpired 
        ? "bg-danger-500/10 border-danger-500/20 text-danger-500" 
        : "bg-surface-700/50 border-subtle text-muted-400"
    )}>
      <Clock size={10} />
      {timeLeft}
    </span>
  )
}

export default function Employees() {
  const { user, updateProfile } = useAuthStore()
  const employees = useEmployeeStore((s) => s.employees)
  const fetchEmployees = useEmployeeStore((s) => s.fetchEmployees)
  const updateRole = useEmployeeStore((s) => s.updateRole)
  const removeEmployee = useEmployeeStore((s) => s.removeEmployee)

  const [menuId, setMenuId] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState('despachador')
  const [inviteDuration, setInviteDuration] = useState(24) // default 24 hours
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchEmployees(true)
  }, [])

  // Generate invitation code
  const handleGenerateInvite = async () => {
    setGenerating(true)
    try {
      const code = 'GO-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const expiresAt = new Date(Date.now() + inviteDuration * 60 * 60 * 1000).toISOString()
      
      const currentInvitations = user.settings?.invitations || []
      const newInvite = {
        code,
        role: inviteRole,
        expiresAt,
        used: false,
        created: new Date().toISOString()
      }

      const updatedSettings = {
        ...user.settings,
        invitations: [newInvite, ...currentInvitations]
      }

      await updateProfile({ settings: updatedSettings })
      toast.success(`Código ${code} generado con éxito`)
      setInviteModalOpen(false)
    } catch (err) {
      toast.error('Error al generar código: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  // Revoke invitation code
  const handleRevokeInvite = async (codeToRevoke) => {
    try {
      const currentInvitations = user.settings?.invitations || []
      const updatedInvitations = currentInvitations.filter(inv => inv.code !== codeToRevoke)
      
      const updatedSettings = {
        ...user.settings,
        invitations: updatedInvitations
      }

      await updateProfile({ settings: updatedSettings })
      toast.success('Invitación revocada correctamente')
    } catch (err) {
      toast.error('Error al revocar: ' + err.message)
    }
  }

  const copyToClipboard = (text, type = 'código') => {
    navigator.clipboard.writeText(text)
    toast.success(`¡${type} copiado al portapapeles!`)
  }

  const invitations = user.settings?.invitations || []

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container space-y-8"
    >
      {/* Dynamic Header */}
      <motion.div 
        variants={itemVariants}
        className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20 flex flex-row items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-brand-600 dark:text-white">Equipo de Trabajo</h1>
          <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">{employees.length + 1} colaboradores activos</p>
        </div>
        <button 
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs md:text-sm font-semibold px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl transition-all duration-300 shadow-glow-sm hover:scale-105 shrink-0"
        >
          <Plus size={14} className="md:size-[16px]" />
          <span className="hidden sm:inline">Vincular Trabajador</span>
          <span className="inline sm:hidden">Vincular</span>
        </button>
      </motion.div>

      {/* Invitation codes section with Liquid Glass styling */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon size={18} className="text-brand-500" />
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Enlaces y Códigos de Vinculación</h2>
        </div>

        {invitations.length === 0 ? (
          <div className="liquid-glass p-6 text-center rounded-3xl space-y-2">
            <p className="text-xs font-bold text-muted-400">No hay códigos de vinculación activos.</p>
            <p className="text-[11px] text-muted-500">Genera un código temporal para que tus trabajadores se registren y vinculen al instante.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.slice(0, 4).map((inv) => {
              const isExpired = new Date(inv.expiresAt) < new Date()
              const registerLink = `${window.location.origin}/auth?code=${inv.code}`
              return (
                <div key={inv.code} className="liquid-glass p-4 rounded-3xl flex items-center justify-between gap-4 hover:border-brand-500/20 transition-all duration-300">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-wider text-brand-500 dark:text-brand-400">{inv.code}</span>
                      <span className={clsx(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                        inv.used 
                          ? "bg-success-500/10 border-success-500/20 text-success-500" 
                          : isExpired 
                          ? "bg-danger-500/10 border-danger-500/20 text-danger-500" 
                          : "bg-brand-500/10 border-brand-500/20 text-brand-500"
                      )}>
                        {inv.used ? 'Usado' : isExpired ? 'Vencido' : 'Activo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-400 flex items-center gap-1.5">
                      Rol: <span className="font-bold text-foreground capitalize">{ROLES[inv.role]?.label}</span>
                      {!inv.used && <InviteTimer expiresAt={inv.expiresAt} />}
                    </p>
                    {inv.usedBy && (
                      <p className="text-[10px] text-success-500 truncate">Registrado por: {inv.usedBy}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!inv.used && !isExpired && (
                      <>
                        <button
                          onClick={() => copyToClipboard(inv.code, 'código')}
                          title="Copiar código"
                          className="p-2 rounded-xl bg-surface-700/50 hover:bg-surface-700 border border-subtle text-muted-400 hover:text-white transition-all"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(registerLink, 'enlace')}
                          title="Copiar enlace directo"
                          className="p-2 rounded-xl bg-surface-700/50 hover:bg-surface-700 border border-subtle text-muted-400 hover:text-white transition-all"
                        >
                          <LinkIcon size={13} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRevokeInvite(inv.code)}
                      title="Eliminar"
                      className="p-2 rounded-xl bg-danger-500/10 hover:bg-danger-500/20 border border-danger-500/20 text-danger-500 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Workers grid section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-brand-500" />
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Colaboradores de la Empresa</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Owner/Admin (always present, not fetched in list) */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="liquid-glass border rounded-3xl p-5 space-y-4 relative transition-colors duration-300 border-brand-500/30 shadow-glow-sm"
          >
            <div className="flex items-center gap-3">
              {/* Profile Avatar: circular frame, no borders, no shadows */}
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                {user?.companyLogo ? (
                  <img src={user.companyLogo} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground truncate">{user?.name || 'Administrador'}</p>
                  <ShieldCheck size={14} className="text-brand-500 shrink-0" />
                </div>
                <p className="text-[11px] text-muted-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-brand-500/20 bg-brand-500/10 text-brand-500">
                Dueño
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-success-500/10 text-success-500 border border-success-500/20">
                Activo
              </span>
            </div>
          </motion.div>

          {/* Employee list */}
          <AnimatePresence mode="popLayout">
            {employees.map((emp) => {
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
                  className="liquid-glass border rounded-3xl p-5 space-y-4 relative transition-colors duration-300 hover:border-brand-500/20"
                >
                  <div className="flex items-start gap-3">
                    {/* User profile image: circular frame, no borders, no shadows */}
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                      {emp.avatar_url || emp.logo_url ? (
                        <img src={emp.avatar_url || emp.logo_url} alt="Worker" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-600/30 to-brand-800/30 flex items-center justify-center text-brand-300 font-black text-sm">
                          {(emp.full_name || emp.name || 'W')?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{emp.full_name || emp.name || 'Trabajador'}</p>
                      <p className="text-[11px] text-muted-400 truncate">{emp.email || 'Sin correo'}</p>
                    </div>
                    
                    {/* Action Menu */}
                    <div className="relative shrink-0">
                      <button 
                        onClick={() => setMenuId(menuId === emp.id ? null : emp.id)}
                        className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-700/50 transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {menuId === emp.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-surface-800 border border-subtle rounded-2xl py-1 w-40 shadow-modal overflow-hidden">
                            {Object.keys(ROLES).map((r) => {
                              if (r === 'administrador') return null
                              return (
                                <button 
                                  key={r} 
                                  onClick={() => { updateRole(emp.id, r); setMenuId(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-surface-700 text-left transition-colors font-semibold"
                                >
                                  {emp.role === r && <Check size={10} className="text-brand-500" />}
                                  <span className={emp.role === r ? 'text-brand-500 font-black' : 'text-muted-400'}>
                                    {ROLES[r].label}
                                  </span>
                                </button>
                              )
                            })}
                            <div className="my-1 border-t border-subtle" />
                            <button 
                              onClick={() => { removeEmployee(emp.id); setMenuId(null) }}
                              className="w-full px-3 py-2.5 text-xs text-left hover:bg-surface-700 transition-colors text-danger-500 font-bold"
                            >
                              Eliminar Trabajador
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                      meta.color, meta.bg
                    )}>
                      <Icon size={10} />
                      {ROLES[emp.role]?.label || emp.role}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-success-500/10 text-success-500 border border-success-500/20">
                      Activo
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <Modal 
            open={inviteModalOpen} 
            onClose={() => setInviteModalOpen(false)} 
            title="Vincular Trabajador" 
            size="md"
          >
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-600 mb-2 block">1. Selecciona el Rol del Trabajador</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ROLES).map(([k, v]) => {
                      if (k === 'administrador') return null
                      const Icon = ROLE_META[k].icon
                      return (
                        <button 
                          key={k} 
                          type="button"
                          onClick={() => setInviteRole(k)}
                          className={clsx(
                            'py-3.5 px-3 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center gap-1.5',
                            inviteRole === k 
                              ? `border-brand-500 bg-brand-600/10 shadow-glow-sm scale-[1.02]` 
                              : 'border-subtle bg-surface-900/50 hover:border-surface-300'
                          )}
                        >
                          <Icon size={18} className={inviteRole === k ? 'text-brand-500' : 'text-muted-400'} />
                          <p className={clsx('text-xs font-black', inviteRole === k ? 'text-brand-500' : 'text-muted-400')}>{v.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-600 mb-2 block">2. Duración de la Invitación</label>
                  <select 
                    value={inviteDuration} 
                    onChange={e => setInviteDuration(Number(e.target.value))}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value={1}>1 Hora</option>
                    <option value={24}>24 Horas (1 día)</option>
                    <option value={72}>72 Horas (3 días)</option>
                    <option value={168}>168 Horas (7 días)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="secondary"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerateInvite} 
                  disabled={generating}
                  className="flex-1 rounded-xl shadow-glow-sm"
                >
                  {generating ? 'Generando...' : 'Generar Código'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
