import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, ShieldCheck, Truck, Calculator,
  Trash2, MoreVertical, Check, X, Clock, Copy, Link as LinkIcon, Mail,
  LayoutDashboard, DollarSign, Calendar, TrendingUp, Shield
} from 'lucide-react'
import { useAuthStore, ROLES } from '@/store/useAuthStore'
import { useHRStore } from '@/store/useHRStore'
import { usePayrollStore } from '@/store/usePayrollStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

// Subcomponents
import DashboardHR from '@/components/hr/DashboardHR'
import CandidatesKanban from '@/components/hr/CandidatesKanban'
import OrgChart from '@/components/hr/OrgChart'
import VacationsPanel from '@/components/hr/VacationsPanel'
import PayrollPanel from '@/components/hr/PayrollPanel'
import EmployeeDetail360 from '@/components/hr/EmployeeDetail360'

const ROLE_META = {
  administrador: { icon: ShieldCheck, color: 'text-brand-500', bg: 'bg-brand-500/10 border-brand-500/25' },
  despachador: { icon: Truck, color: 'text-warning-500', bg: 'bg-warning-500/10 border-warning-500/25' },
  contable: { icon: Calculator, color: 'text-success-500', bg: 'bg-success-500/10 border-success-500/25' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 } 
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 25 } 
  }
}

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
  
  // HR & Payroll Zustand states
  const employees = useHRStore((s) => s.employees)
  const candidates = useHRStore((s) => s.candidates)
  const vacations = useHRStore((s) => s.vacations)
  const fetchHRData = useHRStore((s) => s.fetchHRData)
  const addEmployee = useHRStore((s) => s.addEmployee)
  const updateEmployee = useHRStore((s) => s.updateEmployee)
  const removeEmployee = useHRStore((s) => s.removeEmployee)
  
  const addCandidate = useHRStore((s) => s.addCandidate)
  const updateCandidateStage = useHRStore((s) => s.updateCandidateStage)
  const removeCandidate = useHRStore((s) => s.removeCandidate)
  
  const requestVacation = useHRStore((s) => s.requestVacation)
  const updateVacationStatus = useHRStore((s) => s.updateVacationStatus)

  const runs = usePayrollStore((s) => s.runs)
  const concepts = usePayrollStore((s) => s.concepts)
  const fetchPayrollData = usePayrollStore((s) => s.fetchPayrollData)
  const calculatePayrollRun = usePayrollStore((s) => s.calculatePayrollRun)
  const approvePayrollRun = usePayrollStore((s) => s.approvePayrollRun)
  const removePayrollRun = usePayrollStore((s) => s.removePayrollRun)

  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, staff, payroll, vacations, recruitment, orgchart
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  
  const [menuId, setMenuId] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState('despachador')
  const [inviteDuration, setInviteDuration] = useState(24)
  const [generating, setGenerating] = useState(false)
  
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false)
  
  // Form states for manual employee addition
  const [newEmpName, setNewEmpName] = useState('')
  const [newEmpEmail, setNewEmpEmail] = useState('')
  const [newEmpPhone, setNewEmpPhone] = useState('')
  const [newEmpDoc, setNewEmpDoc] = useState('')
  const [newEmpSalary, setNewEmpSalary] = useState('')
  const [newEmpPos, setNewEmpPos] = useState('')
  const [newEmpDept, setNewEmpDept] = useState('Logística')
  const [newEmpARL, setNewEmpARL] = useState('clase_1')
  const [newEmpBank, setNewEmpBank] = useState('')
  const [newEmpAccount, setNewEmpAccount] = useState('')
  const [newEmpReportsTo, setNewEmpReportsTo] = useState('')

  useEffect(() => {
    fetchHRData()
    fetchPayrollData()
  }, [])

  // Generate invitation link/code
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

  // Revoke invitation link/code
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

  const handleEmailInvite = async (inv) => {
    const email = prompt('Ingresa el correo electrónico del trabajador:', '')
    if (email === null) return
    if (!email.includes('@')) {
      toast.error('Correo electrónico no válido')
      return
    }

    const toastId = toast.loading('Enviando invitación por correo...')
    try {
      const { sendWorkerInviteEmail } = await import('@/services/emailService')
      const company = {
        companyName: user.companyName || 'GestivaOne',
        companyLogo: user.companyLogo || null,
        companyEmail: user.email || ''
      }

      const res = await sendWorkerInviteEmail({
        workerName: 'Colaborador',
        workerEmail: email.trim(),
        inviteCode: inv.code,
        role: inv.role
      }, company)

      if (res.success) {
        toast.success(`¡Invitación enviada con éxito a ${email}!`, { id: toastId })
      } else {
        toast.error(`Error: ${res.error || 'No se pudo enviar'}`, { id: toastId })
      }
    } catch (e) {
      console.error(e)
      toast.error('Error al iniciar el servicio de correo', { id: toastId })
    }
  }

  const handleManualAddEmployee = async (e) => {
    e.preventDefault()
    if (!newEmpName || !newEmpEmail || !newEmpDoc || !newEmpSalary || !newEmpPos) {
      toast.error('Completa todos los campos requeridos (*)')
      return
    }

    const success = await addEmployee({
      full_name: newEmpName,
      email: newEmpEmail,
      phone: newEmpPhone,
      document_id: newEmpDoc,
      salary: newEmpSalary,
      position: newEmpPos,
      department: newEmpDept,
      arl_class: newEmpARL,
      bank_name: newEmpBank,
      bank_account: newEmpAccount,
      reports_to: newEmpReportsTo || null
    })

    if (success) {
      setAddEmployeeModalOpen(false)
      setNewEmpName('')
      setNewEmpEmail('')
      setNewEmpPhone('')
      setNewEmpDoc('')
      setNewEmpSalary('')
      setNewEmpPos('')
      setNewEmpBank('')
      setNewEmpAccount('')
      setNewEmpReportsTo('')
    }
  }

  const invitations = user.settings?.invitations || []
  const isAdmin = user?.role === 'administrador'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container space-y-6"
    >
      {/* Sticky Header with Actions */}
      <motion.div
        variants={itemVariants}
        className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground">Gestión de Talento Humano</h1>
          <p className="hidden sm:block text-xs text-muted-400 mt-0.5">{employees.length + 1} colaboradores activos en la empresa</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-surface-800 hover:bg-surface-700 text-muted-300 border border-subtle text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-300 shrink-0"
          >
            <LinkIcon size={14} />
            <span>Generar Invitación</span>
          </button>
          <button
            onClick={() => setAddEmployeeModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] shrink-0"
          >
            <Plus size={14} />
            <span>Agregar Colaborador</span>
          </button>
        </div>
      </motion.div>

      {/* Tabs navigation */}
      <div className="flex border-b border-subtle/60 text-xs font-bold text-muted-400 uppercase select-none overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedEmployee(null) }}
          className={clsx(
            "pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 shrink-0",
            activeTab === 'dashboard' ? "border-brand-500 text-brand-500 font-black" : "border-transparent hover:text-foreground"
          )}
        >
          <LayoutDashboard size={14} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={clsx(
            "pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 shrink-0",
            activeTab === 'staff' ? "border-brand-500 text-brand-500 font-black" : "border-transparent hover:text-foreground"
          )}
        >
          <Users size={14} />
          Colaboradores
        </button>
        <button
          onClick={() => { setActiveTab('payroll'); setSelectedEmployee(null) }}
          className={clsx(
            "pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 shrink-0",
            activeTab === 'payroll' ? "border-brand-500 text-brand-500 font-black" : "border-transparent hover:text-foreground"
          )}
        >
          <DollarSign size={14} />
          Nómina
        </button>
        <button
          onClick={() => { setActiveTab('vacations'); setSelectedEmployee(null) }}
          className={clsx(
            "pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 shrink-0",
            activeTab === 'vacations' ? "border-brand-500 text-brand-500 font-black" : "border-transparent hover:text-foreground"
          )}
        >
          <Calendar size={14} />
          Vacaciones
        </button>
        <button
          onClick={() => { setActiveTab('recruitment'); setSelectedEmployee(null) }}
          className={clsx(
            "pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 shrink-0",
            activeTab === 'recruitment' ? "border-brand-500 text-brand-500 font-black" : "border-transparent hover:text-foreground"
          )}
        >
          <TrendingUp size={14} />
          Selección (Kanban)
        </button>
        <button
          onClick={() => { setActiveTab('orgchart'); setSelectedEmployee(null) }}
          className={clsx(
            "pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 shrink-0",
            activeTab === 'orgchart' ? "border-brand-500 text-brand-500 font-black" : "border-transparent hover:text-foreground"
          )}
        >
          <Shield size={14} />
          Organigrama
        </button>
      </div>

      {/* Render Active Tab Component */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {activeTab === 'dashboard' && (
            <DashboardHR
              employees={employees}
              runs={runs}
              vacations={vacations}
              candidates={candidates}
            />
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              {selectedEmployee ? (
                <EmployeeDetail360
                  employee={selectedEmployee}
                  allEmployees={employees}
                  onUpdate={updateEmployee}
                  onClose={() => setSelectedEmployee(null)}
                />
              ) : (
                <div className="space-y-6">
                  {/* Invitation Links Row (Collapsible/Top of staff) */}
                  {invitations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-400">Códigos de Vinculación Activos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {invitations.slice(0, 2).map((inv) => {
                          const isExpired = new Date(inv.expiresAt) < new Date()
                          const registerLink = `${window.location.origin}/auth?code=${inv.code}`
                          return (
                            <div key={inv.code} className="liquid-glass p-4 rounded-3xl flex items-center justify-between gap-4 border border-subtle">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black tracking-wider text-brand-400">{inv.code}</span>
                                  <Badge variant={inv.used ? 'success' : isExpired ? 'danger' : 'brand'}>
                                    {inv.used ? 'Usado' : isExpired ? 'Vencido' : 'Activo'}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-400 mt-1 capitalize">
                                  Rol: <span className="font-bold text-foreground">{ROLES[inv.role]?.label}</span>
                                  {!inv.used && <InviteTimer expiresAt={inv.expiresAt} />}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!inv.used && !isExpired && (
                                  <>
                                    <button onClick={() => copyToClipboard(inv.code, 'código')} className="p-2 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-muted-400 transition-all">
                                      <Copy size={12} />
                                    </button>
                                    <button onClick={() => copyToClipboard(registerLink, 'enlace')} className="p-2 rounded-xl bg-surface-700/50 hover:bg-surface-700 text-muted-400 transition-all">
                                      <LinkIcon size={12} />
                                    </button>
                                  </>
                                )}
                                <button onClick={() => handleRevokeInvite(inv.code)} className="p-2 rounded-xl bg-danger-500/10 hover:bg-danger-500/20 text-danger-500 transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Employees Grid */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-400">Equipo de Trabajo</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Owner Card */}
                      <div className="liquid-glass border border-brand-500/20 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-black text-sm">
                            {(user?.name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-foreground truncate">{user?.name}</p>
                            <p className="text-[10px] text-muted-400 mt-0.5 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-subtle/50">
                          <Badge variant="brand">Director General</Badge>
                          <span className="text-[10px] text-success-500 font-bold uppercase">Propietario</span>
                        </div>
                      </div>

                      {/* Workers Cards */}
                      {employees.map((emp) => {
                        const meta = ROLE_META[emp.role] || ROLE_META.despachador
                        const Icon = meta.icon
                        return (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className="liquid-glass border border-subtle hover:border-brand-500/20 rounded-3xl p-5 space-y-4 cursor-pointer hover:scale-[1.01] transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center text-muted-300 font-black text-sm">
                                  {emp.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-black text-foreground truncate">{emp.full_name}</p>
                                  <p className="text-[10px] text-muted-400 mt-0.5 truncate">{emp.email}</p>
                                </div>
                              </div>
                              
                              <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setMenuId(menuId === emp.id ? null : emp.id)}
                                  className="p-1 rounded-lg text-muted-400 hover:bg-surface-700"
                                >
                                  <MoreVertical size={13} />
                                </button>
                                {menuId === emp.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                                    <div className="absolute right-0 top-6 z-20 bg-surface-800 border border-subtle rounded-2xl py-1 w-36 shadow-modal">
                                      <button
                                        onClick={() => { removeEmployee(emp.id); setMenuId(null) }}
                                        className="w-full px-3 py-2 text-xs text-left text-danger-500 font-bold hover:bg-surface-700"
                                      >
                                        Dar de Baja
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-subtle/50">
                              <Badge variant={emp.role === 'contable' ? 'success' : 'warning'}>
                                {ROLES[emp.role]?.label || emp.role}
                              </Badge>
                              <span className="text-[10px] text-muted-400 font-bold uppercase">{emp.department}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payroll' && (
            <PayrollPanel
              employees={employees}
              runs={runs}
              concepts={concepts}
              calculatePayrollRun={calculatePayrollRun}
              approvePayrollRun={approvePayrollRun}
              removePayrollRun={removePayrollRun}
            />
          )}

          {activeTab === 'vacations' && (
            <VacationsPanel
              employees={employees}
              vacations={vacations}
              requestVacation={requestVacation}
              updateVacationStatus={updateVacationStatus}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'recruitment' && (
            <CandidatesKanban
              candidates={candidates}
              addCandidate={addCandidate}
              updateCandidateStage={updateCandidateStage}
              removeCandidate={removeCandidate}
            />
          )}

          {activeTab === 'orgchart' && (
            <OrgChart employees={employees} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Invitations/Worker generation modal */}
      {inviteModalOpen && typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          <Modal
            open={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            title="Generar Enlace de Vinculación"
            size="md"
          >
            <div className="p-5 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-2 block">1. Selecciona el Rol</label>
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
                            inviteRole === k ? 'border-brand-500 bg-brand-600/10 scale-[1.02]' : 'border-subtle bg-surface-900/50 hover:border-surface-300'
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
                  <label className="text-xs font-bold text-muted-500 mb-2 block">2. Duración del Código</label>
                  <select
                    value={inviteDuration}
                    onChange={e => setInviteDuration(Number(e.target.value))}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  >
                    <option value={1}>1 Hora</option>
                    <option value={24}>24 Horas (1 día)</option>
                    <option value={72}>72 Horas (3 días)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setInviteModalOpen(false)} className="flex-1 rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleGenerateInvite} disabled={generating} className="flex-1 rounded-xl">
                  {generating ? 'Generando...' : 'Generar Enlace'}
                </Button>
              </div>
            </div>
          </Modal>
        </AnimatePresence>,
        document.body
      ) : null}

      {/* Manual Add Employee Modal */}
      {addEmployeeModalOpen && typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          <Modal
            open={addEmployeeModalOpen}
            onClose={() => setAddEmployeeModalOpen(false)}
            title="Registrar Nuevo Colaborador"
            size="lg"
          >
            <form onSubmit={handleManualAddEmployee} className="p-5 space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    value={newEmpName}
                    onChange={e => setNewEmpName(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: Laura Sofía Uribe"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Cédula / Documento *</label>
                  <input
                    required
                    type="text"
                    value={newEmpDoc}
                    onChange={e => setNewEmpDoc(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: 1020304050"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Email Institucional *</label>
                  <input
                    required
                    type="email"
                    value={newEmpEmail}
                    onChange={e => setNewEmpEmail(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: laura@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Teléfono</label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={e => setNewEmpPhone(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: 3001234567"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Salario Mensual (COP) *</label>
                  <input
                    required
                    type="number"
                    value={newEmpSalary}
                    onChange={e => setNewEmpSalary(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: 1300000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Cargo / Posición *</label>
                  <input
                    required
                    type="text"
                    value={newEmpPos}
                    onChange={e => setNewEmpPos(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: Despachador Auxiliar"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Área o Departamento</label>
                  <select
                    value={newEmpDept}
                    onChange={e => setNewEmpDept(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                  >
                    <option value="Logística">Logística</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Jerarquía (¿A quién reporta?)</label>
                  <select
                    value={newEmpReportsTo}
                    onChange={e => setNewEmpReportsTo(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Nadie / Director</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Riesgo ARL</label>
                  <select
                    value={newEmpARL}
                    onChange={e => setNewEmpARL(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                  >
                    <option value="clase_1">Clase I (0.522%)</option>
                    <option value="clase_2">Clase II (1.044%)</option>
                    <option value="clase_3">Clase III (2.436%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Banco</label>
                  <input
                    type="text"
                    value={newEmpBank}
                    onChange={e => setNewEmpBank(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: Bancolombia"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Número Cuenta</label>
                  <input
                    type="text"
                    value={newEmpAccount}
                    onChange={e => setNewEmpAccount(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    placeholder="Ej: 9876543210"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setAddEmployeeModalOpen(false)} className="flex-1 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 rounded-xl">
                  Registrar Colaborador
                </Button>
              </div>
            </form>
          </Modal>
        </AnimatePresence>,
        document.body
      ) : null}
    </motion.div>
  )
}

