import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, ShieldCheck } from 'lucide-react'
import Button from './Button'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('gestiva-cookies-accepted')
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('gestiva-cookies-accepted', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[9999] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-4xl bg-surface-800/90 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl shadow-modal flex flex-col md:flex-row items-center gap-6 pointer-events-auto">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/20 flex items-center justify-center shrink-0 border border-brand-500/20 shadow-glow-sm">
              <Cookie size={24} className="text-brand-400" />
            </div>
            
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h3 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-2">
                Usamos cookies para mejorar tu experiencia
                <ShieldCheck size={14} className="text-success-400" />
              </h3>
              <p className="text-[11px] md:text-xs text-muted-400 leading-relaxed">
                Al navegar en <strong>GestivaOne</strong>, aceptas nuestra política de cookies y términos de servicio. 
                Utilizamos estas tecnologías para personalizar contenido y analizar nuestro tráfico de forma segura.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleAccept}
                className="text-[11px] font-bold text-muted-400 hover:text-white px-4 py-2 transition-colors"
              >
                Configurar
              </button>
              <Button 
                onClick={handleAccept}
                className="flex-1 md:flex-none px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-glow-sm"
              >
                Aceptar todo
              </Button>
            </div>

            <button 
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
