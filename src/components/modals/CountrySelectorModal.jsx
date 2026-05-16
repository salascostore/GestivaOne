import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check, ArrowRight, Zap } from 'lucide-react'
import { SUPPORTED_CURRENCIES, useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore } from '@/store/useAuthStore'
import Button from '@/components/ui/Button'
import clsx from 'clsx'

const COUNTRIES = [
  { id: 'CO', name: 'Colombia', currency: 'COP', lang: 'es-CO', flag: '🇨🇴' },
  { id: 'MX', name: 'México', currency: 'MXN', lang: 'es-MX', flag: '🇲🇽' },
  { id: 'US', name: 'Estados Unidos', currency: 'USD', lang: 'en-US', flag: '🇺🇸' },
  { id: 'ES', name: 'España', currency: 'EUR', lang: 'es-ES', flag: '🇪🇺' },
  { id: 'AR', name: 'Argentina', currency: 'ARS', lang: 'es-AR', flag: '🇦🇷' },
  { id: 'CL', name: 'Chile', currency: 'CLP', lang: 'es-CL', flag: '🇨🇱' },
  { id: 'PE', name: 'Perú', currency: 'PEN', lang: 'es-PE', flag: '🇵🇪' },
  { id: 'CR', name: 'Costa Rica', currency: 'CRC', lang: 'es-CR', flag: '🇨🇷' },
  { id: 'DO', name: 'Rep. Dominicana', currency: 'DOP', lang: 'es-DO', flag: '🇩🇴' },
]

export default function CountrySelectorModal() {
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState(1)
  const setSourceCurrency = useCurrencyStore((s) => s.setSourceCurrency)
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  // Only show if user is logged in but has no country/currency set
  const show = user && !user.country && !localStorage.getItem('gestiva-country-set')

  if (!show) return null

  const handleFinish = async () => {
    const countryData = COUNTRIES.find(c => c.id === selected)
    setSourceCurrency(countryData.currency)
    
    // Save to profile and local storage
    await updateProfile({ 
      country: countryData.id,
      base_currency: countryData.currency,
      language: countryData.lang 
    })
    
    localStorage.setItem('gestiva-country-set', 'true')
    window.location.reload() // Force global update
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-surface-800 border border-subtle rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]"
      >
        {/* Left Side: Visual */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-brand-600 to-brand-900 p-8 flex-col justify-between text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black leading-tight mb-2">Personaliza tu experiencia.</h2>
            <p className="text-brand-200 text-sm">Configuraremos automáticamente divisas, impuestos e idioma para tu región.</p>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 p-6 md:p-10 flex flex-col h-full overflow-hidden">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-brand-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              <Globe size={12} />
              <span>Configuración Global</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Selecciona tu país</h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-3 pb-6">
            {COUNTRIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={clsx(
                  'flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group',
                  selected === c.id 
                    ? 'border-brand-500 bg-brand-600/10' 
                    : 'border-subtle bg-surface-700/50 hover:border-surface-400'
                )}
              >
                <span className="text-2xl">{c.flag}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-400 uppercase tracking-wider">{c.currency}</p>
                </div>
                {selected === c.id && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-subtle mt-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center group"
              disabled={!selected}
              onClick={handleFinish}
              icon={<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            >
              Comenzar ahora
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
