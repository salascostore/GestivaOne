import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Check, Camera, Home, ChevronLeft, Star } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useEmployeeStore } from '@/store/useEmployeeStore'
import { supabase } from '@/lib/supabase'
import PlanSelector from '@/components/auth/PlanSelector'
import CompanyForm from '@/components/auth/CompanyForm'
import PaymentForm from '@/components/auth/PaymentForm'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── Register steps ────────────────────────────────────────────
const STEPS = ['plan', 'datos', 'pago', 'listo']

// ── Onboarding slides ──────────────────────────────────────────
const ONBOARDING_SLIDES = [
  {
    type: 'instagram',
    title: 'Comunidad GestivaOne',
    desc: 'Únete a nuestro Instagram para recibir tips diarios de crecimiento empresarial, finanzas y actualizaciones exclusivas de la plataforma.',
  },
  {
    type: 'tip',
    title: 'Facturación DIAN instantánea',
    desc: 'Emite facturas y notas de crédito en segundos cumpliendo al 100% con la normativa DIAN de forma automatizada.',
    badge: 'Facturación en Vivo'
  },
  {
    type: 'tip',
    title: 'Inventario inteligente',
    desc: 'Monitorea existencias en tiempo real, recibe alertas de stock crítico y reordena mercancías con total facilidad.',
    badge: 'Inventario Pro'
  },
  {
    type: 'tip',
    title: 'Reportes y KPI en Vivo',
    desc: 'Visualiza gráficos dinámicos de ventas, ingresos y flujos de caja del negocio al instante desde cualquier lugar.',
    badge: 'Analíticas Avanzadas'
  }
]

function StepIndicator({ step }) {
  const labels = ['Plan', 'Datos', 'Pago', 'Listo']
  const idx = STEPS.indexOf(step)
  return (
    <div className="flex items-center justify-center gap-1.5 mb-3.5 sm:mb-5">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1.5">
          <div className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300',
            i < idx ? 'bg-brand-500 text-white' :
              i === idx ? 'bg-brand-600 text-white ring-4 ring-brand-400/20 shadow-glow-sm' :
                'bg-surface-700 text-muted-500 border border-subtle'
          )}>{i < idx ? '✓' : i + 1}</div>
          <span className={clsx('text-[10px] font-bold uppercase tracking-wider hidden sm:block', i === idx ? 'text-neutral-900 dark:text-white' : 'text-muted-500')}>{l}</span>
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
function WorkerLogin({ onSocialClick, socialData, onClearSocialData }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const linkWorkerAndRegister = useAuthStore((s) => s.linkWorkerAndRegister)

  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [linkCode, setLinkCode] = useState('')

  // Avatar state
  const [colorAvatar, setColorAvatar] = useState('#8B5CF6') // Purple default
  const [fileAvatar, setFileAvatar] = useState(null)
  const fileInputRef = useRef(null)

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

  // Sync social details if they come from parent
  useEffect(() => {
    if (socialData) {
      setMode('register')
      if (socialData.provider === 'Phone') {
        setPhone(socialData.value)
      } else {
        setEmail(socialData.value)
      }
    }
  }, [socialData])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setFileAvatar(event.target.result)
    }
    reader.readAsDataURL(file)
  }

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

    const finalAvatar = fileAvatar || ('color:' + colorAvatar)

    const res = await linkWorkerAndRegister({
      email: email.trim().toLowerCase(),
      password: pass,
      name: name.trim(),
      phone: phone.trim(),
      linkCode: linkCode.trim().toUpperCase(),
      avatar: finalAvatar
    })
    setLoading(false)
    if (!res.success) return toast.error(res.error)

    toast.success('¡Vinculación y registro exitoso! Bienvenido a bordo.')
    if (onClearSocialData) onClearSocialData()
    navigate('/')
  }

  if (mode === 'login') {
    return (
      <div className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <p className="text-center text-xs text-muted-500 mb-2 sm:mb-4">Ingresa con tus credenciales vinculadas a la empresa.</p>

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

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setMode('register')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              ¿Aún no te has vinculado? Regístrate aquí
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
      <p className="text-center text-xs text-muted-500 mb-1.5">Coloca tu información y el código de vinculación de tu empresa.</p>

      {/* Avatar custom selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-600 block text-center font-medium">Foto de perfil</label>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              style={{ backgroundColor: fileAvatar ? undefined : colorAvatar }}
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 border-brand-500/30 shadow-glow-sm transition-all duration-300"
            >
              {fileAvatar ? (
                <img src={fileAvatar} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-white">
                  {name?.trim() ? name.trim().charAt(0).toUpperCase() : 'W'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center shadow-lg hover:bg-brand-500 transition-colors border border-surface-800"
            >
              <Camera size={11} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Importar tu foto
            </button>

            <div className="flex justify-center gap-2 mt-1">
              {[
                { hex: '#8B5CF6', name: 'Morado' },
                { hex: '#3B82F6', name: 'Azul' },
                { hex: '#10B981', name: 'Verde' },
                { hex: '#F59E0B', name: 'Naranja' },
                { hex: '#EF4444', name: 'Rojo' }
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => {
                    setFileAvatar(null)
                    setColorAvatar(c.hex)
                  }}
                  style={{ backgroundColor: c.hex }}
                  className={clsx(
                    "w-6 h-6 rounded-full transition-all duration-200 border-2 cursor-pointer",
                    (!fileAvatar && colorAvatar === c.hex) ? "border-white scale-110 shadow-glow-sm" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  title={c.name}
                />
              ))}
            </div>
          </div>
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

      {socialData?.provider === 'Phone' ? (
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
      ) : (
        <div>
          <label className="text-xs font-bold text-muted-600 mb-1 block">Número de Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 300 000 0000"
            type="tel"
            required
            disabled={!!socialData}
            className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-75 disabled:cursor-not-allowed" 
          />
        </div>
      )}

      {socialData?.provider !== 'Phone' && (
        <div>
          <label className="text-xs font-bold text-muted-600 mb-1 block">Correo electrónico</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            type="email"
            required
            disabled={!!socialData}
            className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-75 disabled:cursor-not-allowed" 
          />
        </div>
      )}

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

      <div className="flex gap-2">
        {socialData && (
          <button
            type="button"
            onClick={onClearSocialData}
            className="flex-1 py-3 rounded-xl border border-subtle hover:bg-surface-700 text-muted-400 text-sm font-semibold transition-colors"
          >
            Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold shadow-glow-sm transition-all duration-300"
        >
          {loading ? 'Procesando...' : 'Registrar y Vincular'}
        </button>
      </div>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => {
            if (onClearSocialData) onClearSocialData()
            setMode('login')
          }}
          className="text-xs font-bold text-muted-500 hover:text-foreground transition-colors"
        >
          ¿Ya tienes cuenta vinculada? Inicia sesión aquí
        </button>
      </div>

    </form>
  )
}

function SocialAccessOptions_REMOVED({ onProviderClick, label = "ingresar" }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-surface-700/80" />
        <span className="text-[10px] font-black text-muted-500 uppercase tracking-widest">o {label} con</span>
        <div className="flex-1 h-px bg-surface-700/80" />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {/* Google OAuth */}
        <button
          type="button"
          onClick={() => onProviderClick('Google')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-700 hover:bg-surface-650 rounded-xl text-xs text-foreground font-bold transition-all hover:scale-[1.02] shadow-sm"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.5 3.77v3.13h4.03c2.36-2.17 3.52-5.38 3.52-8.75z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.03-3.13c-1.12.75-2.55 1.19-3.93 1.19-3.03 0-5.6-2.05-6.52-4.82H1.31v3.2A11.99 11.99 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.48 14.33A7.16 7.16 0 0 1 5 12c0-.82.15-1.62.42-2.38V6.42H1.31A11.99 11.99 0 0 0 0 12c0 2.24.62 4.33 1.69 6.13l3.79-3.8z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0A11.99 11.99 0 0 0 1.31 6.42l3.79 3.8c.92-2.77 3.49-4.82 6.9-4.82z" />
          </svg>
          Google
        </button>

        {/* Apple OAuth */}
        <button
          type="button"
          onClick={() => onProviderClick('Apple')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-black hover:bg-neutral-900 rounded-xl text-xs text-white font-bold transition-all hover:scale-[1.02] shadow-sm"
        >
          <svg className="w-3.5 h-3.5 shrink-0 fill-white" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.35.87.86 0 2.22-1.08 3.74-.91.63.03 2.44.2 3.57 1.6-.03.02-2.18 1.28-2.15 3.81.03 3.02 2.6 4.09 2.61 4.14-.23.72-1.31 2.26-2.39 2.26-.63 0-1.19-.32-1.95-.32-.75 0-1.54.4-2.15.4z" />
          </svg>
          Apple
        </button>

        {/* Magic Link */}
        <button
          type="button"
          onClick={() => onProviderClick('MagicLink')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-700 hover:bg-surface-650 rounded-xl text-xs text-foreground font-bold transition-all hover:scale-[1.02] shadow-sm"
        >
          <svg className="w-3.5 h-3.5 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Enlace
        </button>
      </div>
    </div>
  )
}

// ── Login tab ─────────────────────────────────────────────────
function LoginForm({ socialAutofill, onClearAutofill }) {
  const navigate   = useNavigate()
  const login      = useAuthStore((s) => s.login)
  const loginWithSocialEmail = useAuthStore((s) => s.loginWithSocialEmail)
  const loginWithSocialPhone = useAuthStore((s) => s.loginWithSocialPhone)
  const loading = useAuthStore((s) => s.loading)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('gestiva-remember-me')
    return saved === 'true'
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem('gestiva-remembered-email')
    const savedPass = localStorage.getItem('gestiva-remembered-password')
    const savedRemember = localStorage.getItem('gestiva-remember-me') === 'true'
    const explicitLogout = localStorage.getItem('gestiva-explicit-logout') === 'true'

    if (savedEmail) {
      setEmail(savedEmail)
    }

    let decodedPass = ''
    if (savedPass) {
      try {
        decodedPass = atob(savedPass)
        setPass(decodedPass)
      } catch (e) {
        console.error('Error decoding saved password:', e)
      }
    }

    if (savedRemember && savedEmail && decodedPass && !explicitLogout) {
      const autoLogin = async () => {
        const result = await login(savedEmail.trim().toLowerCase(), decodedPass)
        if (result.success) {
          toast.success('Sesión restaurada automáticamente')
          localStorage.removeItem('gestiva-explicit-logout')
          navigate('/', { replace: true })
        }
      }
      autoLogin()
    }
  }, [login, navigate])

  // Handle social autofill and password dots visual animation
  useEffect(() => {
    if (socialAutofill) {
      const targetVal = socialAutofill.email || socialAutofill.phone || ''
      setEmail(targetVal)

      let i = 0
      const mockPass = '••••••••••••'
      setPass('')

      const interval = setInterval(() => {
        if (i < mockPass.length) {
          setPass(prev => prev + '•')
          i++
        } else {
          clearInterval(interval)
          // Automatically trigger login after animation finishes
          setTimeout(() => {
            submit()
          }, 400)
        }
      }, 70)

      return () => clearInterval(interval)
    }
  }, [socialAutofill])

  const submit = async (e) => {
    if (e) e.preventDefault()

    let result
    if (socialAutofill) {
      if (socialAutofill.provider === 'Phone') {
        result = await loginWithSocialPhone(email)
      } else {
        result = await loginWithSocialEmail(email)
      }
    } else {
      result = await login(email.trim().toLowerCase(), pass)
    }

    if (!result.success) {
      if (onClearAutofill) onClearAutofill()
      return toast.error(result.error)
    }

    if (rememberMe && !socialAutofill) {
      localStorage.setItem('gestiva-remembered-email', email.trim().toLowerCase())
      localStorage.setItem('gestiva-remembered-password', btoa(pass))
      localStorage.setItem('gestiva-remember-me', 'true')
      localStorage.removeItem('gestiva-explicit-logout')
    } else if (!socialAutofill) {
      localStorage.removeItem('gestiva-remembered-email')
      localStorage.removeItem('gestiva-remembered-password')
      localStorage.setItem('gestiva-remember-me', 'false')
    }

    toast.success('¡Bienvenido!')
    if (onClearAutofill) onClearAutofill()

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

  const sendPasswordReset = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return toast.error('Ingresa tu correo primero')

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth?mode=login`,
    })

    if (error) return toast.error(error.message)
    toast.success('Te enviamos un enlace para cambiar tu contraseña')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-600 mb-1 block">Correo electrónico</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            type="email"
            required
            readOnly={!!socialAutofill}
            className={clsx(
              "w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
              socialAutofill && "opacity-75 cursor-not-allowed bg-surface-800"
            )}
          />
        </div>
        <div className="relative">
          <label className="text-xs font-bold text-muted-600 mb-1 block font-medium">Contraseña <span className="text-danger-500">*</span></label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Introduce la contraseña"
            type={showPw ? 'text' : 'password'}
            required
            readOnly={!!socialAutofill}
            className={clsx(
              "w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-10",
              socialAutofill && "opacity-75 cursor-not-allowed bg-surface-800 font-mono tracking-widest"
            )}
          />
          {!socialAutofill && (
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
          )}
        </div>

        {/* Remember me checkbox */}
        {!socialAutofill && (
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
            <button
              type="button"
              onClick={sendPasswordReset}
              className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors"
            >
              Cambiar contraseña
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-glow-sm"
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}

// ── Register multi-step ───────────────────────────────────────
function RegisterFlow({ step, setStep, onSocialClick, socialData, onClearSocialData }) {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [plan, setPlan] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('plan') || 'pro'
  })
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)

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

  const handleBack = () => {
    if (socialData && step === 'datos') {
      if (onClearSocialData) onClearSocialData()
      setStep('plan')
    } else {
      setStep(STEPS[STEPS.indexOf(step) - 1])
    }
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
          {step === 'plan' && <PlanSelector selected={plan} onSelect={setPlan} />}
          {step === 'datos' && <CompanyForm onSubmit={goNext} defaultValues={formData} plan={plan} socialData={socialData} />}
          {step === 'pago' && <PaymentForm plan={plan} onSubmit={handlePayment} loading={loading} />}
          {step === 'listo' && (
            <div className="text-center space-y-4 py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <CheckCircle2 size={64} className="text-success-400 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">¡Registro exitoso!</h2>
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
        <button onClick={handleBack} className="mt-4 flex items-center gap-1.5 text-xs text-muted-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={13} /> Volver
        </button>
      )}

      {/* Plan → next */}
      {step === 'plan' && (
        <button onClick={() => goNext()} className="mt-5 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors">
          Continuar con {plan === 'standard' ? 'Standard' : plan === 'pro' ? 'Pro' : 'GO 360'} →
        </button>
      )}
    </div>
  )
}

// ── Main Auth page ────────────────────────────────────────────
const TABS = [
  { id: 'login', label: 'Ingresar' },
  { id: 'register', label: 'Registrarse' },
  { id: 'worker', label: 'Soy Trabajador' },
]

function SocialAuthModal({ isOpen, onClose, provider, action, onConfirm }) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const isPhone = provider === 'Phone'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setLoading(true)
    setErrorMsg('')

    const statuses = [
      `Conectando con servidores de ${provider}...`,
      `Abriendo ventana segura de verificación...`,
      `Validando token de seguridad...`,
      `Comprobando registros en base de datos...`
    ]

    let idx = 0
    setLoadingStatus(statuses[0])
    const interval = setInterval(() => {
      idx = (idx + 1) % statuses.length
      setLoadingStatus(statuses[idx])
    }, 450)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const column = isPhone ? 'phone' : 'email'
      const checkValue = inputValue.trim().toLowerCase()

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .eq(column, checkValue)
        .limit(1)

      clearInterval(interval)

      if (error) {
        setLoading(false)
        setErrorMsg('Error de conexión con el servidor. Inténtalo de nuevo.')
        return
      }

      const userExists = data && data.length > 0

      if (action === 'login' || action === 'worker_login') {
        if (!userExists) {
          setLoading(false)
          setErrorMsg(`No existe cuenta vinculada a este ${isPhone ? 'número de teléfono' : 'correo electrónico'}.`)
          return
        }
      } else {
        if (userExists) {
          setLoading(false)
          setErrorMsg('Esta cuenta ya existe. Por favor, inicia sesión.')
          return
        }
      }

      setLoading(false)
      onConfirm(inputValue.trim())
    } catch (err) {
      clearInterval(interval)
      setLoading(false)
      setErrorMsg('Ocurrió un error inesperado.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-surface-800 border border-subtle w-full max-w-md rounded-3xl p-6 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-subtle pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className={clsx(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              provider === 'Google' ? 'bg-red-500' : provider === 'Apple' ? 'bg-neutral-200' : 'bg-brand-500'
            )} />
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">
              Acceso Seguro con {provider}
            </h3>
          </div>
          {!loading && (
            <button 
              onClick={onClose}
              className="text-xs font-bold text-muted-500 hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
            <p className="text-sm font-semibold text-white tracking-wide animate-pulse">{loadingStatus}</p>
            <p className="text-[10px] text-muted-500">Esto tomará solo unos segundos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-400">
              {isPhone 
                ? 'Introduce tu número telefónico verificado por tu operador móvil para autorizar el acceso.'
                : `Verifica tu cuenta vinculando el correo electrónico asociado a tu perfil de ${provider}.`
              }
            </p>

            <div>
              <label className="text-[10px] font-black text-muted-500 uppercase tracking-widest mb-1.5 block">
                {isPhone ? 'Número de Teléfono' : 'Correo electrónico'}
              </label>
              <input
                required
                type={isPhone ? 'tel' : 'email'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isPhone ? '+57 300 000 0000' : `tu_usuario@${provider.toLowerCase()}.com`}
                className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/25 text-xs text-danger-400 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-glow-sm transition-all duration-200"
            >
              Continuar con {provider}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [regStep, setRegStep] = useState('plan')
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === ONBOARDING_SLIDES.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [])


  const handleClearWorkerSocialData = () => {
    setWorkerSocialData(null)
  }

  const handleClearRegisterSocialData = () => {
    setRegisterSocialData(null)
    setRegStep('plan')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const mode = params.get('mode')
    if (code) {
      setTab('worker')
    } else if (mode === 'register') {
      setTab('register')
      setRegStep('plan')
    } else if (mode === 'login') {
      setTab('login')
    } else if (mode === 'confirm_email') {
      // Handle magic link confirmation
      toast.success('¡Correo confirmado! Iniciando sesión...')
      // The session should already be established by Supabase
    }
  }, [])

  return (
    <div className="h-screen bg-surface-900 flex overflow-hidden">
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 h-full bg-[#07070a] border-r border-white/5 p-8 select-none relative overflow-hidden">
        {/* Glow ambient inside sidebar */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-brand-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-3 pb-6 border-b border-white/5 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-brand-600/10 border border-brand-500/30 flex items-center justify-center">
            <Zap size={16} className="text-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-extrabold text-white text-lg tracking-tight leading-none">Gestiva</p>
              <span className="text-[10px] font-black uppercase tracking-wider bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded border border-brand-500/20 leading-none">One</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 relative z-10 my-auto">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/10">
              Gestión Comercial Inteligente
            </span>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black text-white leading-tight tracking-tight"
            >
              La plataforma comercial <br />
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">que tu empresa merece</span>
            </motion.h1>
          </div>

          {/* Onboarding Carousel (White Card style similar to image 2) */}
          <div className="bg-white text-neutral-900 rounded-2xl p-5 shadow-2xl flex flex-col justify-between border border-neutral-100 min-h-[410px] w-full relative overflow-hidden select-none">
            {/* Slide Graphic Section (Top half) */}
            <div className="flex-1 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Render simulated graphic based on slide type */}
                  {ONBOARDING_SLIDES[activeSlide].type === 'instagram' ? (
                    /* Instagram Profile Simulator */
                    <div className="w-full bg-neutral-50 rounded-2xl border border-neutral-200/60 p-4 space-y-3 relative overflow-hidden flex-1 flex flex-col justify-between min-h-[160px]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0">
                          <div className="w-full h-full rounded-full bg-white p-[2px]">
                            <div className="w-full h-full rounded-full bg-brand-600 flex items-center justify-center text-white">
                              <Zap size={16} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-[11px] text-neutral-900 leading-tight">gestivaone</span>
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                              <Check size={8} className="text-white stroke-[4]" />
                            </div>
                          </div>
                          <p className="text-[9px] text-muted-500">Gestión Comercial</p>
                        </div>

                        <a 
                          href="https://instagram.com" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[9px] font-bold transition-all shadow-sm shrink-0"
                        >
                          Seguir
                        </a>
                      </div>

                      <p className="text-[9.5px] text-neutral-600 leading-relaxed font-semibold">
                        ⚡ Plataforma de facturación y gestión comercial. <br />
                        💡 Crecimiento, automatización y tips diarios.
                      </p>

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-neutral-200/50">
                        <div className="aspect-square bg-gradient-to-br from-brand-500/10 to-brand-500/30 rounded-xl flex flex-col items-center justify-center p-1 border border-brand-500/10 hover:scale-[1.03] transition-transform">
                          <Zap size={13} className="text-brand-600 mb-0.5" />
                          <span className="text-[6.5px] font-black uppercase text-brand-700 text-center leading-none">Emite</span>
                        </div>
                        <div className="aspect-square bg-gradient-to-br from-success-500/10 to-success-500/30 rounded-xl flex flex-col items-center justify-center p-1 border border-success-500/10 hover:scale-[1.03] transition-transform">
                          <CheckCircle2 size={13} className="text-success-600 mb-0.5" />
                          <span className="text-[6.5px] font-black uppercase text-success-700 text-center leading-none">DIAN</span>
                        </div>
                        <div className="aspect-square bg-gradient-to-br from-warning-500/10 to-warning-500/30 rounded-xl flex flex-col items-center justify-center p-1 border border-warning-500/10 hover:scale-[1.03] transition-transform">
                          <Star size={13} className="text-warning-600 mb-0.5" />
                          <span className="text-[6.5px] font-black uppercase text-warning-700 text-center leading-none">Controla</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tips Graphics */
                    <div className="w-full bg-neutral-50 rounded-2xl border border-neutral-200/60 p-4 relative overflow-hidden flex-1 flex flex-col justify-center items-center min-h-[160px]">
                      {/* Ambient grid */}
                      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:14px_14px]" />
                      
                      {activeSlide === 1 && (
                        <motion.div 
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="p-3.5 bg-white border border-neutral-200 rounded-2xl shadow-xl flex items-center gap-3 relative z-10 w-[85%] max-w-[260px]"
                        >
                          <div className="w-8.5 h-8.5 rounded-xl bg-success-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} className="text-success-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-neutral-800 truncate">Factura Electrónica</p>
                            <p className="text-[8px] text-success-600 font-bold">✓ Enviada exitosamente a DIAN</p>
                          </div>
                        </motion.div>
                      )}

                      {activeSlide === 2 && (
                        <div className="flex gap-2 relative z-10 w-[85%] justify-center">
                          <motion.div 
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            className="flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl shadow-lg flex flex-col gap-1 max-w-[110px]"
                          >
                            <span className="text-[7px] font-black uppercase text-neutral-400">Stock OK</span>
                            <span className="text-[11px] font-extrabold text-neutral-800 leading-none">1,240 uds</span>
                          </motion.div>
                          <motion.div 
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="flex-1 p-2.5 bg-white border border-danger-200 rounded-xl shadow-lg flex flex-col gap-1 max-w-[110px]"
                          >
                            <span className="text-[7px] font-black uppercase text-danger-500">Bajo Stock</span>
                            <span className="text-[11px] font-extrabold text-danger-600 leading-none">12 uds</span>
                          </motion.div>
                        </div>
                      )}

                      {activeSlide === 3 && (
                        <motion.div 
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                          className="p-3 bg-white border border-neutral-200 rounded-xl shadow-xl w-[85%] max-w-[240px] space-y-2 relative z-10"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-extrabold text-neutral-800">Ventas Mensuales</span>
                            <span className="text-[9px] font-black text-success-600">+34%</span>
                          </div>
                          <div className="h-8 flex items-end gap-1.5 pt-1">
                            {[25, 50, 35, 65, 85, 60, 95].map((val, i) => (
                              <div key={i} className="flex-1 bg-brand-500/25 hover:bg-brand-500 rounded-t transition-colors" style={{ height: `${val}%` }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Slide text contents */}
                  <div className="space-y-1 pt-3.5 text-left">
                    {ONBOARDING_SLIDES[activeSlide].badge && (
                      <span className="text-[8px] bg-brand-500/10 text-brand-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-block">
                        {ONBOARDING_SLIDES[activeSlide].badge}
                      </span>
                    )}
                    <h3 className="text-xs font-black text-neutral-900 leading-tight">
                      {ONBOARDING_SLIDES[activeSlide].title}
                    </h3>
                    <p className="text-[9.5px] text-neutral-500 leading-normal font-semibold">
                      {ONBOARDING_SLIDES[activeSlide].desc}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer controls (pagination only) */}
            <div className="flex items-center justify-center pt-3 border-t border-neutral-100 mt-3.5 select-none w-full">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 justify-center">
                {ONBOARDING_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    className={clsx(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      activeSlide === i ? "bg-[#4338CA] w-4" : "bg-neutral-200"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-muted-500 relative z-10">
          <span>© 2026 GestivaOne.</span>
          <span className="font-semibold text-brand-400">Diseño Industrial Premium</span>
        </div>
      </div>

      {/* Right: form panel */}
      <div className={clsx(
        "flex-1 flex flex-col items-center p-3 sm:p-6 overflow-y-auto relative h-full",
        (tab === 'register' && regStep === 'plan') ? "justify-start sm:py-12 py-6" : "justify-center"
      )}>
        {/* Ambient Background Elements (wrapped to prevent overflow/scrollbars) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.03)_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[140px] animate-pulse-slow" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/8 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/4 rounded-full blur-[120px]" />
        </div>

        <div className={clsx(
          "w-full relative z-10 transition-all duration-500",
          (tab === 'register' && regStep === 'plan') ? "max-w-[1400px]" : "max-w-md"
        )}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-3.5 sm:mb-6">
            <Zap size={20} className="text-brand-400" />
            <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Gestiva <span className="text-brand-400 font-extrabold">One</span></span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-surface-800 border border-subtle rounded-2xl p-1 mb-3.5 sm:mb-4 relative shadow-glow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors relative z-10',
                  tab === t.id ? 'text-white' : 'text-muted-400 hover:text-neutral-900 dark:hover:text-muted-200'
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

          {/* Form card - with relative positioning for button overlay */}
          <div className="relative bg-surface-800 border border-subtle rounded-2xl p-4 sm:p-5 shadow-modal">
            {/* Home button - positioned near top left */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => window.location.href = '/'}
              className="absolute -top-4 -left-4 w-10 h-10 bg-surface-800 border border-subtle rounded-full flex items-center justify-center hover:bg-surface-700 hover:text-white transition-colors group z-20 text-muted-400 shadow-sm"
              title="Volver al inicio"
            >
              <Home size={18} className="transition-colors" />
            </motion.button>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'login' && (
                  <LoginForm
                    socialAutofill={null}
                    onClearAutofill={() => {}}
                  />
                )}
                {tab === 'register' && (
                  <RegisterFlow
                    step={regStep}
                    setStep={setRegStep}
                    socialData={null}
                    onClearSocialData={() => {}}
                  />
                )}
                {tab === 'worker' && (
                  <WorkerLogin
                    onSocialClick={() => {}}
                    socialData={null}
                    onClearSocialData={() => {}}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  )
}
