import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Check } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useEmployeeStore } from '@/store/useEmployeeStore'
import PlanSelector from '@/components/auth/PlanSelector'
import CompanyForm  from '@/components/auth/CompanyForm'
import PaymentForm  from '@/components/auth/PaymentForm'
import Input        from '@/components/ui/Input'
import toast        from 'react-hot-toast'
import clsx         from 'clsx'
import GestivaLogo from '@/components/ui/GestivaLogo'

// ── Register steps ────────────────────────────────────────────
const STEPS = ['plan', 'datos', 'pago', 'listo']

function StepIndicator({ step }) {
  const labels = ['Plan', 'Datos', 'Pago', 'Listo']
  const idx = STEPS.indexOf(step)
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1.5">
          <div className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300',
            i < idx  ? 'bg-brand-500 text-white' :
            i === idx ? 'bg-brand-600 text-white ring-4 ring-brand-400/20 shadow-glow-sm' :
                        'bg-surface-700 text-muted-500 border border-subtle'
          )}>{i < idx ? '✓' : i + 1}</div>
          <span className={clsx('text-[10px] font-bold uppercase tracking-wider hidden sm:block', i === idx ? 'text-white' : 'text-muted-500')}>{l}</span>
          {i < 3 && (
            <div className="w-4 sm:w-8 h-px bg-surface-700 overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: i < idx ? '100%' : '0%' }}
                className="h-full bg-brand-500" 
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Worker login tab ──────────────────────────────────────────
function WorkerLogin() {
  const navigate = useNavigate()
  const loginAsWorker = useAuthStore((s) => s.loginAsWorker)
  const loginEmployee  = useEmployeeStore((s) => s.loginEmployee)
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const emp = await loginEmployee(email.trim().toLowerCase(), pass)
    setLoading(false)
    if (!emp) return toast.error('Credenciales incorrectas o cuenta inactiva')
    loginAsWorker({ ...emp, isWorker: true })
    toast.success(`¡Bienvenido, ${emp.full_name || emp.name}!`)
    navigate('/')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-center text-sm text-muted-400 mb-4">Ingresa con las credenciales que tu administrador configuró.</p>
      <div>
        <label className="text-xs text-muted-400 mb-1 block">Correo electrónico</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" type="email" required
          className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
      </div>
      <div className="relative">
        <label className="text-xs text-muted-400 mb-1 block">Contraseña</label>
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" type={showPw ? 'text' : 'password'} required
          className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 pr-10" />
        <button 
          type="button" 
          onMouseDown={() => setShowPw(true)}
          onMouseUp={() => setShowPw(false)}
          onMouseLeave={() => setShowPw(false)}
          onTouchStart={() => setShowPw(true)}
          onTouchEnd={() => setShowPw(false)}
          className="absolute right-3 bottom-2.5 text-muted-400 hover:text-white"
        >
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <button type="submit" className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors">
        Entrar como trabajador
      </button>
    </form>
  )
}

// ── Login tab ─────────────────────────────────────────────────
function LoginForm() {
  const navigate   = useNavigate()
  const login      = useAuthStore((s) => s.login)
  const loading    = useAuthStore((s) => s.loading)
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('gestiva-remembered-email')
    return !!saved
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem('gestiva-remembered-email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const result = await login(email.trim().toLowerCase(), pass)
    if (!result.success) return toast.error(result.error)
    
    if (rememberMe) {
      localStorage.setItem('gestiva-remembered-email', email.trim().toLowerCase())
    } else {
      localStorage.removeItem('gestiva-remembered-email')
    }

    toast.success('¡Bienvenido!')
    
    // Force a small delay to ensure state is saved, then jump to dashboard
    setTimeout(() => {
      navigate('/', { replace: true })
      // Emergency fallback if navigate doesn't trigger
      setTimeout(() => {
        if (window.location.pathname === '/auth') {
          window.location.href = '/'
        }
      }, 1000)
    }, 100)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs text-muted-400 mb-1 block">Correo electrónico</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" type="email" required
          className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
      </div>
      <div className="relative">
        <label className="text-xs text-muted-400 mb-1 block font-medium">Contraseña <span className="text-danger-500">*</span></label>
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Introduce la contraseña" type={showPw ? 'text' : 'password'} required
          className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 pr-10" />
        <button 
          type="button" 
          onMouseDown={() => setShowPw(true)}
          onMouseUp={() => setShowPw(false)}
          onMouseLeave={() => setShowPw(false)}
          onTouchStart={() => setShowPw(true)}
          onTouchEnd={() => setShowPw(false)}
          className="absolute right-3 bottom-2.5 text-muted-400 hover:text-white"
        >
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      
      {/* Remember me checkbox */}
      <div className="flex items-center justify-between pb-1 select-none">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={rememberMe} 
            onChange={(e) => setRememberMe(e.target.checked)} 
            className="sr-only" 
          />
          <div className={clsx(
            'w-[18px] h-[18px] rounded border flex items-center justify-center transition-all',
            rememberMe 
              ? 'bg-amber-500 border-amber-500 text-white' 
              : 'border-subtle bg-surface-700 group-hover:border-surface-400'
          )}>
            {rememberMe && <Check size={12} strokeWidth={3} className="text-white animate-scale-up" />}
          </div>
          <span className="text-xs font-semibold text-muted-300 group-hover:text-white transition-colors">Acuérdate de mí</span>
        </label>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
        {loading ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}

// ── Register multi-step ───────────────────────────────────────
function RegisterFlow() {
  const navigate  = useNavigate()
  const register  = useAuthStore((s) => s.register)
  const [step, setStep]   = useState('plan')
  const [plan, setPlan]   = useState('pro')
  const [formData, setFormData] = useState({})
  const [loading, setLoading]   = useState(false)

  const goNext = (data = {}) => {
    const nextData = { ...formData, ...data }
    setFormData(nextData)
    
    if (step === 'datos' && plan === 'standard') {
      // Skip payment for free plan
      handlePayment({}, nextData)
      return
    }
    
    setStep(STEPS[STEPS.indexOf(step) + 1])
  }

  const handlePayment = async (paymentData, currentData = formData) => {
    setLoading(true)
    const res = await register({ 
      ...currentData, 
      plan, 
      email: currentData.email?.trim().toLowerCase(),
      ...paymentData
    })
    setLoading(false)
    if (!res.success) {
      if (res.error?.includes('security purposes')) {
        return toast.error('Espera un momento antes de intentar de nuevo (seguridad)')
      }
      return toast.error(res.error)
    }
    setStep('listo')
  }

  return (
    <div>
      {step !== 'listo' && <StepIndicator step={step} />}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'plan'  && <PlanSelector selected={plan} onSelect={setPlan} />}
          {step === 'datos' && <CompanyForm  onSubmit={goNext} defaultValues={formData} plan={plan} />}
          {step === 'pago'  && <PaymentForm  plan={plan} onSubmit={handlePayment} loading={loading} />}
          {step === 'listo' && (
            <div className="text-center space-y-4 py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <CheckCircle2 size={64} className="text-success-400 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">¡Registro exitoso!</h2>
              <p className="text-muted-400 text-sm">Tu cuenta ha sido creada. Bienvenido a GestivaOne.</p>
              <button onClick={() => navigate('/')} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors mt-2">
                Entrar al dashboard →
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Back button */}
      {step !== 'plan' && step !== 'listo' && (
        <button onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1])} className="mt-4 flex items-center gap-1.5 text-xs text-muted-400 hover:text-white transition-colors">
          <ArrowLeft size={13} /> Volver
        </button>
      )}

      {/* Plan → next */}
      {step === 'plan' && (
        <button onClick={() => goNext()} className="mt-5 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors">
          Continuar con {plan === 'standard' ? 'Standard' : plan === 'pro' ? 'Pro' : 'Empresarial'} →
        </button>
      )}
    </div>
  )
}

// ── Main Auth page ────────────────────────────────────────────
const TABS = [
  { id: 'login',    label: 'Ingresar'       },
  { id: 'register', label: 'Registrarse'    },
  { id: 'worker',   label: 'Soy Trabajador' },
]

export default function Auth() {
  const [tab, setTab] = useState('login')

  return (
    <div className="min-h-screen bg-surface-900 flex">
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 bg-gradient-to-b from-brand-900/60 to-surface-800 border-r border-subtle p-10">
        <div className="flex items-center gap-4 pb-6 border-b border-brand-500/30">
          <GestivaLogo className="w-12 h-12 shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-bold text-white text-2xl leading-none">Gestiva</p>
              <Check size={16} className="text-brand-400" />
            </div>
            <p className="text-brand-400 text-xs font-semibold tracking-widest uppercase">One</p>
          </div>
        </div>

        <div className="space-y-8">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-extrabold text-white leading-tight"
          >
            La plataforma comercial <br />
            <span className="text-brand-400">que tu empresa merece</span>
          </motion.h1>
          <ul className="space-y-4">
            {['Facturación en tiempo real', 'Gestión de clientes e inventario', 'Dashboard con analíticas', 'Control de empleados por roles', 'Tasas de cambio automáticas'].map((f, i) => (
              <motion.li 
                key={f} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex items-center gap-3.5 text-sm text-muted-400 font-medium"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 border border-brand-500/20">
                  <Zap size={12} className="text-brand-400" />
                </div>
                {f}
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-muted-400">© 2026 GestivaOne. Todos los derechos reservados.</p>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center p-5 overflow-y-auto relative overflow-hidden">
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.03)_1.5px,transparent_1.5px)] [background-size:32px_32px] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-slow" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/4 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-6">
            <GestivaLogo className="w-8 h-8 shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider">Gestiva <span className="text-brand-400 font-extrabold">One</span></span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-surface-800 border border-subtle rounded-2xl p-1 mb-5 relative">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors relative z-10',
                  tab === t.id ? 'text-white' : 'text-muted-400 hover:text-muted-200'
                )}
              >
                {tab === t.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-brand-600 rounded-xl shadow-glow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 shadow-modal">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'login'    && <LoginForm />}
                {tab === 'register' && <RegisterFlow />}
                {tab === 'worker'   && <WorkerLogin />}
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 pt-5 border-t border-subtle/50 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              <p className="text-[10px] text-muted-500 font-medium uppercase tracking-widest flex items-center gap-1.5">
                <Lock size={10} className="text-success-500" /> Conexión segura SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
