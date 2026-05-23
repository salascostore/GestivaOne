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

// ── Worker login/register tab ──────────────────────────────────
const WORKER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
]

function WorkerLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const linkWorkerAndRegister = useAuthStore((s) => s.linkWorkerAndRegister)
  
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [linkCode, setLinkCode] = useState('')
  const [avatar, setAvatar] = useState(WORKER_AVATARS[0])
  
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      setLinkCode(code.toUpperCase())
      setMode('register')
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(email.trim().toLowerCase(), pass)
    setLoading(false)
    if (!res.success) return toast.error(res.error)
    toast.success('¡Bienvenido!')
    navigate('/')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await linkWorkerAndRegister({
      email: email.trim().toLowerCase(),
      password: pass,
      name: name.trim(),
      phone: phone.trim(),
      linkCode: linkCode.trim().toUpperCase(),
      avatar
    })
    setLoading(false)
    if (!res.success) return toast.error(res.error)
    
    toast.success('¡Vinculación y registro exitoso! Bienvenido a bordo.')
    navigate('/')
  }

  if (mode === 'login') {
    return (
      <form onSubmit={handleLogin} className="space-y-4">
        <p className="text-center text-xs text-muted-500 mb-4">Ingresa con tus credenciales vinculadas a la empresa.</p>
        
        <div>
          <label className="text-xs font-bold text-muted-600 mb-1 block">Correo electrónico</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="tu@empresa.com" 
            type="email" 
            required
            className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" 
          />
        </div>
        
        <div className="relative">
          <label className="text-xs font-bold text-muted-600 mb-1 block">Contraseña</label>
          <input 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
            placeholder="••••••" 
            type={showPw ? 'text' : 'password'} 
            required
            className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-10" 
          />
          <button 
            type="button" 
            onMouseDown={() => setShowPw(true)}
            onMouseUp={() => setShowPw(false)}
            onMouseLeave={() => setShowPw(false)}
            onTouchStart={() => setShowPw(true)}
            onTouchEnd={() => setShowPw(false)}
            className="absolute right-3 bottom-3 text-muted-400 hover:text-foreground"
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold shadow-glow-sm transition-all duration-300"
        >
          {loading ? 'Ingresando...' : 'Entrar como trabajador'}
        </button>

        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={() => setMode('register')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            ¿Aún no te has vinculado? Regístrate aquí
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <p className="text-center text-xs text-muted-500 mb-2">Coloca tu información y el código de vinculación de tu empresa.</p>

      {/* Avatar circular selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-600 block text-center font-medium">Selecciona tu foto</label>
        <div className="flex justify-center gap-2">
          {WORKER_AVATARS.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setAvatar(url)}
              className={clsx(
                "w-11 h-11 rounded-full overflow-hidden transition-all duration-300 border-2",
                avatar === url ? "border-brand-600 scale-110 shadow-glow-sm" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={url} alt="Avatar" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-muted-600 mb-1 block">Tu Nombre</label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Nombre completo" 
          type="text" 
          required
          className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" 
        />
      </div>

      <div>
        <label className="text-xs font-bold text-muted-600 mb-1 block">Número de Teléfono</label>
        <input 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          placeholder="+57 300 000 0000" 
          type="tel" 
          required
          className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" 
        />
      </div>

      <div>
        <label className="text-xs font-bold text-muted-600 mb-1 block">Correo electrónico</label>
        <input 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="tu@correo.com" 
          type="email" 
          required
          className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" 
        />
      </div>

      <div className="relative">
        <label className="text-xs font-bold text-muted-600 mb-1 block">Contraseña</label>
        <input 
          value={pass} 
          onChange={(e) => setPass(e.target.value)} 
          placeholder="••••••" 
          type={showPw ? 'text' : 'password'} 
          required
          className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-10" 
        />
        <button 
          type="button" 
          onMouseDown={() => setShowPw(true)}
          onMouseUp={() => setShowPw(false)}
          onMouseLeave={() => setShowPw(false)}
          onTouchStart={() => setShowPw(true)}
          onTouchEnd={() => setShowPw(false)}
          className="absolute right-3 bottom-2 text-muted-400 hover:text-foreground"
        >
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <div>
        <label className="text-xs font-bold text-brand-600 mb-1 block">Código de Vinculación</label>
        <input 
          value={linkCode} 
          onChange={(e) => setLinkCode(e.target.value)} 
          placeholder="GO-XXXXXX" 
          type="text" 
          required
          className="w-full bg-brand-50 border border-brand-500/30 rounded-xl px-4 py-2.5 text-sm text-brand-750 placeholder:text-brand-400/70 focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-black text-center tracking-wider" 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold shadow-glow-sm transition-all duration-300"
      >
        {loading ? 'Procesando...' : 'Registrar y Vincular'}
      </button>

      <div className="text-center pt-1">
        <button 
          type="button"
          onClick={() => setMode('login')}
          className="text-xs font-bold text-muted-500 hover:text-foreground transition-colors"
        >
          ¿Ya tienes cuenta vinculada? Inicia sesión aquí
        </button>
      </div>
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
        <label className="text-xs font-bold text-muted-600 mb-1 block">Correo electrónico</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" type="email" required
          className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
      </div>
      <div className="relative">
        <label className="text-xs font-bold text-muted-600 mb-1 block font-medium">Contraseña <span className="text-danger-500">*</span></label>
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Introduce la contraseña" type={showPw ? 'text' : 'password'} required
          className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-10" />
        <button 
          type="button" 
          onMouseDown={() => setShowPw(true)}
          onMouseUp={() => setShowPw(false)}
          onMouseLeave={() => setShowPw(false)}
          onTouchStart={() => setShowPw(true)}
          onTouchEnd={() => setShowPw(false)}
          className="absolute right-3 bottom-2.5 text-muted-400 hover:text-foreground"
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
              : 'border-subtle bg-surface-900 group-hover:border-surface-400'
          )}>
            {rememberMe && <Check size={12} strokeWidth={3} className="text-white animate-scale-up" />}
          </div>
          <span className="text-xs font-bold text-muted-500 group-hover:text-foreground transition-colors">Acuérdate de mí</span>
        </label>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-glow-sm">
        {loading ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}

// ── Register multi-step ───────────────────────────────────────
function RegisterFlow({ step, setStep }) {
  const navigate  = useNavigate()
  const register  = useAuthStore((s) => s.register)
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
  const [regStep, setRegStep] = useState('plan')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      setTab('worker')
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface-900 flex">
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 bg-gradient-to-b from-[#1c1236] to-[#0a0a0f] border-r border-white/5 p-10 select-none">
        <div className="flex items-center gap-4 pb-6 border-b border-purple-500/20">
          <Zap size={32} className="text-purple-400" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-bold text-white text-2xl leading-none">Gestiva</p>
              <Check size={16} className="text-purple-400" />
            </div>
            <p className="text-purple-400 text-xs font-semibold tracking-widest uppercase">One</p>
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
            <span className="text-purple-400">que tu empresa merece</span>
          </motion.h1>
          <ul className="space-y-4">
            {['Facturación en tiempo real', 'Gestión de clientes e inventario', 'Dashboard con analíticas', 'Control de empleados por roles', 'Tasas de cambio automáticas'].map((f, i) => (
              <motion.li 
                key={f} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex items-center gap-3.5 text-sm text-gray-300 font-medium"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Zap size={12} className="text-purple-400" />
                </div>
                {f}
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-gray-400">© 2026 GestivaOne. Todos los derechos reservados.</p>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-4 md:p-6 overflow-y-auto relative min-h-screen">
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.03)_1.5px,transparent_1.5px)] [background-size:32px_32px] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-slow" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/4 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className={clsx(
          "w-full relative z-10 transition-all duration-500",
          (tab === 'register' && regStep === 'plan') ? "max-w-5xl" : "max-w-md"
        )}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-6">
            <Zap size={20} className="text-brand-400" />
            <span className="font-bold text-white uppercase tracking-wider">Gestiva <span className="text-brand-400 font-extrabold">One</span></span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-surface-800 border border-subtle rounded-2xl p-1 mb-4 relative shadow-glow-sm">
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
                {tab === 'register' && <RegisterFlow step={regStep} setStep={setRegStep} />}
                {tab === 'worker'   && <WorkerLogin />}
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 pt-3.5 border-t border-subtle flex items-center justify-center gap-2">
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
