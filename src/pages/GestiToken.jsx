import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ShieldAlert, ShieldCheck, Clock, Copy, Check, Lock, Unlock } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

// Framer Motion variants
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

export default function GestiToken() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  // Config states (fallback to defaults if undefined in user.settings)
  const enabled = user?.settings?.gestibot_otp_enabled ?? false
  const duration = user?.settings?.gestibot_otp_duration ?? 3600000 // default 1 hour

  // Code generation state
  const [otpCode, setOtpCode] = useState('000 000')
  const [timeLeft, setTimeLeft] = useState(60 - new Date().getSeconds())
  const [copied, setCopied] = useState(false)

  // Circular progress dimensions
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeLeft / 60) * circumference

  // TOTP-like deterministic code generator based on minute epoch and companyId hash
  const generateOTP = (companyId) => {
    const epochMin = Math.floor(Date.now() / 60000)
    let compHash = 0
    if (companyId) {
      for (let i = 0; i < companyId.length; i++) {
        compHash += companyId.charCodeAt(i)
      }
    }
    // LCG seed generation
    let seed = epochMin * 1234567 + compHash * 98765 + 987654321
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const otp = 100000 + (seed % 900000)
    return otp.toString()
  }

  // Update code and tick seconds
  useEffect(() => {
    // Initial generation
    const currentCode = generateOTP(user?.companyId)
    setOtpCode(currentCode.slice(0, 3) + ' ' + currentCode.slice(3))

    const interval = setInterval(() => {
      const now = new Date()
      const sec = now.getSeconds()
      const newTimeLeft = 60 - sec
      setTimeLeft(newTimeLeft)

      // When the minute rolls over, recalculate the OTP code
      if (sec === 0) {
        const nextCode = generateOTP(user?.companyId)
        setOtpCode(nextCode.slice(0, 3) + ' ' + nextCode.slice(3))
        // Force state reset for copied check on code change
        setCopied(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user?.companyId])

  // Toggle dynamic key requirements
  const handleToggleSecurity = async () => {
    const previousEnabled = enabled
    const newEnabled = !enabled
    
    // 1. Optimistic Update (Instant feedback)
    useAuthStore.setState((s) => ({
      user: {
        ...s.user,
        settings: {
          ...(s.user?.settings || {}),
          gestibot_otp_enabled: newEnabled
        }
      }
    }))
    
    toast.success(newEnabled 
      ? 'Seguridad GestiBot activada.' 
      : 'Seguridad GestiBot desactivada.'
    )

    // 2. Background Sync
    try {
      const currentSettings = user?.settings || {}
      const updatedSettings = {
        ...currentSettings,
        gestibot_otp_enabled: newEnabled
      }
      
      // We don't await this so the UI doesn't freeze
      updateProfile({ settings: updatedSettings }).then((res) => {
        if (res?.success === false) {
          // Revert on failure
          useAuthStore.setState((s) => ({
            user: {
              ...s.user,
              settings: {
                ...(s.user?.settings || {}),
                gestibot_otp_enabled: previousEnabled
              }
            }
          }))
          toast.error(res.error || 'Error al guardar. Se han revertido los cambios.')
        }
      })
    } catch (e) {
      // Revert on throw
      useAuthStore.setState((s) => ({
        user: {
          ...s.user,
          settings: {
            ...(s.user?.settings || {}),
            gestibot_otp_enabled: previousEnabled
          }
        }
      }))
      toast.error('Error de red. Se revirtió el cambio.')
    }
  }

  // Change active session duration limits
  const handleDurationChange = async (e) => {
    const newDuration = Number(e.target.value)
    const previousDuration = duration

    // 1. Optimistic Update
    useAuthStore.setState((s) => ({
      user: {
        ...s.user,
        settings: {
          ...(s.user?.settings || {}),
          gestibot_otp_duration: newDuration
        }
      }
    }))
    toast.success('Duración actualizada')

    // 2. Background Sync
    try {
      const currentSettings = user?.settings || {}
      const updatedSettings = {
        ...currentSettings,
        gestibot_otp_duration: newDuration
      }

      updateProfile({ settings: updatedSettings }).then((res) => {
        if (res?.success === false) {
          useAuthStore.setState((s) => ({
            user: { ...s.user, settings: { ...(s.user?.settings || {}), gestibot_otp_duration: previousDuration } }
          }))
          toast.error(res.error || 'Error al actualizar. Cambios revertidos.')
        }
      })
    } catch (e) {
      useAuthStore.setState((s) => ({
        user: { ...s.user, settings: { ...(s.user?.settings || {}), gestibot_otp_duration: previousDuration } }
      }))
      toast.error('Ocurrió un error al guardar.')
    }
  }

  // Handle code copying
  const handleCopy = () => {
    const rawCode = otpCode.replace(' ', '')
    navigator.clipboard.writeText(rawCode)
    setCopied(true)
    toast.success('GestiToken copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container space-y-6 max-w-5xl mx-auto p-4 md:p-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              GestiToken
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Control de seguridad y doble factor para consultas desde WhatsApp (GestiBot)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center mt-1">
          <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${enabled ? 'text-success-500' : 'text-danger-500'}`}>
            {enabled ? (
              <>GestiBot Protegido <ShieldCheck size={14} /></>
            ) : (
              <>Seguridad Inactiva <ShieldAlert size={14} /></>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Config Panel */}
        <motion.div variants={itemVariants} className="md:col-span-7 space-y-6">
          
          {/* Card 1: Main Toggle Switch */}
          <div className="bg-surface-800 border border-subtle rounded-3xl p-5 md:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-foreground">Requerir GestiToken en WhatsApp</h3>
                <p className="text-xs text-muted-400">Si está activo, Gesti exigirá ingresar este código dinámico para responder consultas de reportes.</p>
              </div>
              <button 
                onClick={handleToggleSecurity}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                  enabled ? 'bg-brand-600' : 'bg-surface-600'
                }`}
              >
                <span className="sr-only">Toggle Security</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* If enabled, show duration configuration */}
            <AnimatePresence>
              {enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-subtle space-y-3"
                >
                  <label className="block text-xs font-bold text-muted-400 uppercase tracking-wider">
                    Duración de la Sesión Autorizada
                  </label>
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={handleDurationChange}
                      className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    >
                      <option value={60000}>1 minuto (Ideal para pruebas)</option>
                      <option value={600000}>10 minutos</option>
                      <option value={3600000}>1 hora (Recomendado)</option>
                      <option value={21600000}>6 horas</option>
                      <option value={86400000}>24 horas</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-muted-400 leading-relaxed">
                    Una vez que digite el GestiToken en WhatsApp, su sesión se mantendrá abierta por este lapso de tiempo. No necesitará volver a digitar el token dinámico hasta que expire este período.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 2: Security Information / Help */}
          <div className="bg-surface-800/60 border border-subtle rounded-3xl p-5 md:p-6 space-y-4">
            <h3 className="text-xs font-black text-muted-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-brand-500" />
              ¿Por qué activar el GestiToken?
            </h3>
            <div className="space-y-3 text-xs text-muted-400 leading-relaxed">
              <p>
                WhatsApp es un canal de comunicación muy ágil, pero es susceptible a clonación de números (SIM swapping) o robo físico del dispositivo.
              </p>
              <div className="p-3 bg-surface-900/60 rounded-xl border border-subtle/40 space-y-2">
                <p className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
                  <Shield size={14} className="text-brand-500" /> Seguridad Zero-Trust:
                </p>
                <p className="text-[10px]">
                  Al activar el GestiToken, aunque alguien acceda a su chat de WhatsApp, **no podrá extraer información financiera de su negocio** ni consultar balances generales a menos que tenga acceso físico a este panel web para ver el código en tiempo real.
                </p>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Right Column: Code Token Display Widget */}
        <motion.div variants={itemVariants} className="md:col-span-5">
          <div className="bg-surface-800 border border-subtle rounded-3xl p-6 shadow-glow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
            
            {/* Background design elements */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-brand-600/5 rounded-full blur-2xl pointer-events-none" />

            {/* Shield State Icon */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                enabled 
                  ? 'bg-success-500/10 border-success-500/20 text-success-400' 
                  : 'bg-surface-900 border-subtle text-muted-500'
              }`}>
                {enabled ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
              </div>
            </div>

            <span className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">
              GESTITOKEN ACTUAL
            </span>

            {/* Displaying large glowing 6-digit OTP */}
            <div className="my-6">
              <p className={`text-4xl md:text-5xl font-extrabold tracking-widest font-mono text-center select-all select-none ${
                enabled 
                  ? 'text-brand-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]' 
                  : 'text-muted-500'
              }`}>
                {otpCode}
              </p>
            </div>

            {/* Dynamic countdown element using circular path */}
            <div className="flex items-center gap-3 mb-6 bg-surface-900/60 border border-subtle/40 px-4 py-2 rounded-2xl">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r={radius / 3.5}
                    className="stroke-surface-700"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r={radius / 3.5}
                    className={`${enabled ? 'stroke-brand-500' : 'stroke-muted-500'} transition-all duration-1000`}
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * (radius / 3.5)}
                    strokeDashoffset={2 * Math.PI * (radius / 3.5) - (timeLeft / 60) * 2 * Math.PI * (radius / 3.5)}
                  />
                </svg>
                <span className="absolute text-[9px] font-mono font-bold text-foreground">
                  {timeLeft}
                </span>
              </div>
              <p className="text-xs text-muted-400 text-left leading-tight">
                {enabled 
                  ? `El token cambiará automáticamente en ${timeLeft}s` 
                  : 'Active la seguridad para usar el token'
                }
              </p>
            </div>

            {/* Copy Button */}
            <Button
              variant={enabled ? 'primary' : 'secondary'}
              disabled={!enabled}
              onClick={handleCopy}
              className="w-full py-2.5 rounded-xl border"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
            >
              {copied ? 'Copiado' : 'Copiar Token'}
            </Button>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
