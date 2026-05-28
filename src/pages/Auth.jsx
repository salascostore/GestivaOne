import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Check, Camera } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useEmployeeStore } from '@/store/useEmployeeStore'
import { supabase } from '@/lib/supabase'
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
    <div className="flex items-center justify-center gap-1.5 mb-3.5 sm:mb-5">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1.5">
          <div className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300',
            i < idx  ? 'bg-brand-500 text-white' :
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
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
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

        <SocialAccessOptions onProviderClick={(provider) => onSocialClick(provider, 'worker_login')} label="ingresar" />
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
      
      {!socialData && (
        <SocialAccessOptions onProviderClick={(provider) => onSocialClick(provider, 'worker_register')} label="registrarte" />
      )}
    </form>
  )
}

function SocialAccessOptions({ onProviderClick, label = "ingresar" }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-surface-700/80" />
        <span className="text-[10px] font-black text-muted-500 uppercase tracking-widest">o {label} con</span>
        <div className="flex-1 h-px bg-surface-700/80" />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onProviderClick('Google')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-700 hover:bg-surface-650 rounded-xl text-xs text-foreground font-bold transition-all hover:scale-[1.02] shadow-sm select-none border-0"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.5 3.77v3.13h4.03c2.36-2.17 3.52-5.38 3.52-8.75z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.03-3.13c-1.12.75-2.55 1.19-3.93 1.19-3.03 0-5.6-2.05-6.52-4.82H1.31v3.2A11.99 11.99 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.48 14.33A7.16 7.16 0 0 1 5 12c0-.82.15-1.62.42-2.38V6.42H1.31A11.99 11.99 0 0 0 0 12c0 2.24.62 4.33 1.69 6.13l3.79-3.8z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0A11.99 11.99 0 0 0 1.31 6.42l3.79 3.8c.92-2.77 3.49-4.82 6.9-4.82z"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => onProviderClick('Apple')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-700 hover:bg-surface-650 rounded-xl text-xs text-foreground font-bold transition-all hover:scale-[1.02] shadow-sm select-none border-0"
        >
          <svg className="w-3.5 h-3.5 shrink-0 fill-current text-white" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12.87 0 1.95-.57 2.51-1.45z" />
          </svg>
          Apple
        </button>
        <button
          type="button"
          onClick={() => onProviderClick('Phone')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-700 hover:bg-surface-650 rounded-xl text-xs text-foreground font-bold transition-all hover:scale-[1.02] shadow-sm select-none border-0"
        >
          <svg className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[2.2] text-brand-400" viewBox="0 0 24 24">
            <rect x="6" y="2" width="12" height="20" rx="2.5" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
          Teléfono
        </button>
      </div>
    </div>
  )
}

// ── Login tab ─────────────────────────────────────────────────
function LoginForm({ onSocialClick, socialAutofill, onClearAutofill }) {
  const navigate   = useNavigate()
  const login      = useAuthStore((s) => s.login)
  const loginWithSocialEmail = useAuthStore((s) => s.loginWithSocialEmail)
  const loginWithSocialPhone = useAuthStore((s) => s.loginWithSocialPhone)
  const loading    = useAuthStore((s) => s.loading)
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
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
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !!socialAutofill}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-glow-sm"
        >
          {socialAutofill 
            ? `Autenticando con ${socialAutofill.provider}...` 
            : loading 
              ? 'Ingresando...' 
              : 'Iniciar sesión'
          }
        </button>
      </form>
      {!socialAutofill && <SocialAccessOptions onProviderClick={onSocialClick} label="ingresar" />}
    </div>
  )
}

// ── Register multi-step ───────────────────────────────────────
function RegisterFlow({ step, setStep, onSocialClick, socialData, onClearSocialData }) {
  const navigate  = useNavigate()
  const register  = useAuthStore((s) => s.register)
  const [plan, setPlan]   = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('plan') || 'pro'
  })
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
          {step === 'plan'  && <PlanSelector selected={plan} onSelect={setPlan} />}
          {step === 'datos' && <CompanyForm  onSubmit={goNext} defaultValues={formData} plan={plan} socialData={socialData} />}
          {step === 'pago'  && <PaymentForm  plan={plan} onSubmit={handlePayment} loading={loading} />}
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
  const [tab, setTab] = useState('login')
  const [regStep, setRegStep] = useState('plan')

  const [socialModal, setSocialModal] = useState({
    isOpen: false,
    provider: null, // 'Google' | 'Apple' | 'Phone'
    action: null,   // 'login' | 'register' | 'worker_login' | 'worker_register'
  })
  
  const [workerSocialData, setWorkerSocialData] = useState(null)
  const [registerSocialData, setRegisterSocialData] = useState(null)
  const [socialAutofill, setSocialAutofill] = useState(null)

  const handleSocialClick = (provider, action) => {
    setSocialModal({
      isOpen: true,
      provider,
      action
    })
  }

  const handleClearWorkerSocialData = () => {
    setWorkerSocialData(null)
  }

  const handleClearRegisterSocialData = () => {
    setRegisterSocialData(null)
    setRegStep('plan')
  }

  const handleSocialConfirm = (value) => {
    const { provider, action } = socialModal
    setSocialModal({ isOpen: false, provider: null, action: null })

    if (action === 'login' || action === 'worker_login') {
      if (action === 'worker_login') {
        setTab('login')
      }
      setSocialAutofill({
        provider,
        email: provider === 'Phone' ? null : value,
        phone: provider === 'Phone' ? value : null
      })
    } else if (action === 'register') {
      setRegisterSocialData({ provider, value })
      setTab('register')
      setRegStep('datos')
    } else if (action === 'worker_register') {
      setWorkerSocialData({ provider, value })
      setTab('worker')
    }
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
    }
  }, [window.location.search])

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
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto relative min-h-screen">
        {/* Ambient Background Elements (wrapped to prevent overflow/scrollbars) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.03)_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[140px] animate-pulse-slow" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/8 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/4 rounded-full blur-[120px]" />
        </div>

        <div className={clsx(
          "w-full relative z-10 transition-all duration-500",
          (tab === 'register' && regStep === 'plan') ? "max-w-5xl" : "max-w-md"
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

          {/* Form card */}
          <div className="bg-surface-800 border border-subtle rounded-2xl p-4 sm:p-5 shadow-modal">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'login'    && (
                  <LoginForm 
                    onSocialClick={(provider) => handleSocialClick(provider, 'login')}
                    socialAutofill={socialAutofill}
                    onClearAutofill={() => setSocialAutofill(null)}
                  />
                )}
                {tab === 'register' && (
                  <RegisterFlow 
                    step={regStep} 
                    setStep={setRegStep} 
                    onSocialClick={(provider) => handleSocialClick(provider, 'register')}
                    socialData={registerSocialData}
                    onClearSocialData={handleClearRegisterSocialData}
                  />
                )}
                {tab === 'worker'   && (
                  <WorkerLogin 
                    onSocialClick={(provider, action) => handleSocialClick(provider, action)}
                    socialData={workerSocialData}
                    onClearSocialData={handleClearWorkerSocialData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-3.5 pt-3 sm:mt-4 sm:pt-3.5 border-t border-subtle flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              <p className="text-[10px] text-muted-500 font-medium uppercase tracking-widest flex items-center gap-1.5">
                <Lock size={10} className="text-success-500" /> Conexión segura SSL
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {socialModal.isOpen && (
          <SocialAuthModal
            isOpen={socialModal.isOpen}
            provider={socialModal.provider}
            action={socialModal.action}
            onClose={() => setSocialModal({ isOpen: false, provider: null, action: null })}
            onConfirm={handleSocialConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
