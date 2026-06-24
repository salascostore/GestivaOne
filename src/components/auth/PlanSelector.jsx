import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Star, Building2, Check, ChevronDown, Sparkles, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const glows = {
  standard: 'border-brand-500/10 hover:border-brand-500/30',
  pro: 'border-success-500/10 hover:border-success-500/30',
  empresarial: 'border-warning-500/10 hover:border-warning-500/30',
  enterprise: 'border-brand-500/10 hover:border-brand-500/30',
}

const badgeStyles = {
  standard: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
  pro: 'bg-success-500/10 border-success-500/20 text-success-400',
  empresarial: 'bg-warning-500/10 border-warning-500/20 text-warning-400',
}

const BILLING_PRICES = {
  monthly: {
    standard: { price: '$0', promo: null, period: '/siempre' },
    pro: { price: '$32.000', promo: '$7.000', promoLabel: '78% desc. primer mes', period: '/mes' },
    empresarial: { price: '$120.000', promo: '$80.000', promoLabel: '33% desc. primeros 3 meses', period: '/mes' },
    enterprise: { price: 'Personalizado', promo: null, period: '' }
  },
  yearly: {
    standard: { price: '$0', promo: null, period: '/siempre' },
    pro: { price: '$25.600', promo: null, promoLabel: 'Facturado anualmente (20% desc.)', period: '/mes' },
    empresarial: { price: '$96.000', promo: null, promoLabel: 'Facturado anualmente (20% desc.)', period: '/mes' },
    enterprise: { price: 'Personalizado', promo: null, period: '' }
  }
}

export default function PlanSelector({ selected, onSelect }) {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' or 'yearly'
  const [showComparison, setShowComparison] = useState(false)
  const comparisonRef = useRef(null)

  useEffect(() => {
    if (showComparison && comparisonRef.current) {
      setTimeout(() => {
        comparisonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [showComparison])

  const plans = Object.values(PLANS).filter(p => p.id !== 'master')

  const handleCustomPlanClick = () => {
    toast.success('¡Nos adaptamos a ti! Nuestro equipo se pondrá en contacto pronto para diseñar tu plan a medida.', {
      duration: 4000,
      icon: '✨'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col items-center text-center space-y-4 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wider">
            Elige tu plan comercial
          </h2>
          <p className="text-[11px] text-muted-500">
            Selecciona el plan ideal para expandir tu negocio. Cambia o cancela cuando quieras.
          </p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center bg-surface-700/50 p-1 rounded-full border border-subtle select-none">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300',
              billingCycle === 'monthly' ? 'bg-[#4338CA] text-white shadow-glow-sm' : 'text-muted-400 hover:text-black dark:hover:text-white'
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={clsx(
              'relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5',
              billingCycle === 'yearly' ? 'bg-[#4338CA] text-white shadow-glow-sm' : 'text-muted-400 hover:text-black dark:hover:text-white'
            )}
          >
            Anual
            <span className="text-[8px] bg-success-500/20 text-success-400 border border-success-500/20 px-1.5 py-0.5 rounded-full font-black uppercase">
              -20%
            </span>
          </button>
        </div>
      </div>
      
      {/* Plans Grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar md:grid md:grid-cols-2 xl:grid-cols-5 xl:overflow-x-visible xl:pb-0 w-full max-w-7xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selected === plan.id
          const activeGlow = glows[plan.id] || glows.standard
          const activeBadge = badgeStyles[plan.id] || badgeStyles.standard

          const prices = BILLING_PRICES[billingCycle][plan.id] || BILLING_PRICES.monthly[plan.id]

          return (
            <motion.button
              key={plan.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (plan.isContact) {
                  window.location.href = 'mailto:soporte@gestivaone.com?subject=Consulta%20Plan%20Enterprise';
                } else {
                  onSelect(plan.id)
                }
              }}
              className={clsx(
                'group relative w-[320px] md:w-full shrink-0 snap-center text-left border rounded-3xl p-5 transition-[border-color,background-color] duration-300 flex flex-col justify-between min-h-[420px] bg-surface-800 border-subtle/50 hover:border-surface-400 select-none shadow-sm relative overflow-hidden',
                isSelected && 'ring-2 ring-brand-500/20 border-brand-500'
              )}
            >
              {/* Glow background wrap */}
              <div className={clsx('absolute inset-0 pointer-events-none rounded-3xl transition-opacity opacity-40 group-hover:opacity-100', activeGlow)} />

              {plan.popular && (
                <span className="absolute -top-0 right-6 bg-brand-500 text-white text-[8px] font-black px-3 py-1 rounded-b-xl flex items-center gap-1 shadow-sm uppercase tracking-wider z-10">
                  <Star size={8} fill="currentColor" /> RECOMENDADO
                </span>
              )}

              {/* Botón arriba como el Bento Onboarding */}
              <div className="w-full space-y-4 flex-1 flex flex-col justify-between relative z-10">
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <div className={clsx('w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300', activeBadge)}>
                      {plan.id === 'empresarial' ? <Building2 size={16} /> : <Zap size={16} />}
                    </div>
                    <span className="text-[9px] font-bold text-muted-500 uppercase tracking-widest bg-surface-900 border border-subtle px-2 py-0.5 rounded-full">
                      {plan.id === 'empresarial' ? 'Completo' : plan.id === 'pro' ? 'Crecimiento' : 'Básico'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-neutral-900 dark:text-white text-base tracking-tight leading-none">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      {prices.promo ? (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-neutral-900 dark:text-white font-black text-xl leading-none">
                              {prices.promo}
                            </span>
                            <span className="text-xs text-muted-500 line-through font-bold leading-none">
                              {prices.price}
                            </span>
                          </div>
                          <span className="text-[8px] font-extrabold tracking-wider uppercase bg-success-500/15 text-success-400 px-2 py-0.5 rounded-full mt-1.5 w-max border border-success-500/10">
                            {prices.promoLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-900 dark:text-white font-black text-xl leading-none">
                          {prices.price}
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-muted-500 dark:text-muted-400 block mt-1 font-bold lowercase tracking-wider leading-none">
                      {prices.period}
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4">
                  <div className={clsx(
                    'w-full py-2.5 px-4 rounded-full text-xs font-black text-center transition-all duration-300 select-none border',
                    isSelected 
                      ? 'bg-[#4338CA] text-white border-[#4338CA]' 
                      : 'bg-surface-700/60 text-muted-300 border-subtle/40 group-hover:bg-[#4338CA] group-hover:text-white group-hover:border-[#4338CA]'
                  )}>
                    {isSelected ? 'Plan Seleccionado' : 'Elegir Plan'}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-left pt-4 border-t border-subtle/50 w-full px-1 mt-4 relative z-10">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-neutral-800 dark:text-neutral-300 leading-tight">
                    <Check size={11} className="stroke-[3.5] text-brand-500 shrink-0 mt-0.5" />
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.button>
          )
        })}

        {/* 5ª Tarjeta Customizada Enterprise */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleCustomPlanClick}
          className="group relative w-[320px] md:w-full shrink-0 snap-center text-left border border-subtle/30 rounded-3xl p-5 transition-[border-color,background-color] duration-300 flex flex-col justify-between min-h-[420px] bg-surface-900/40 backdrop-blur-md overflow-hidden select-none opacity-80 hover:opacity-100 shadow-sm"
        >
          <div className="w-full space-y-4 flex-1 flex flex-col justify-between relative z-10">
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl border border-warning-500/20 bg-warning-500/10 text-warning-400 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <span className="text-[9px] font-bold text-warning-400 uppercase tracking-widest bg-warning-500/5 border border-warning-500/15 px-2 py-0.5 rounded-full">
                  Exclusivo
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-neutral-900 dark:text-white text-base tracking-tight leading-none">
                  Plan Personalizado
                </h3>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-neutral-900 dark:text-white font-black text-xl leading-none">
                    A Medida
                  </span>
                </div>
                <span className="text-[9.5px] text-muted-500 dark:text-muted-400 block mt-1 font-bold leading-none">
                  Para requerimientos a gran escala
                </span>
              </div>
            </div>

            <div className="w-full mt-4">
              <div className="w-full py-2.5 px-4 rounded-full text-xs font-black text-center transition-all duration-300 select-none border bg-surface-700/60 text-muted-300 border-subtle/40 group-hover:bg-[#4338CA] group-hover:text-white group-hover:border-[#4338CA]">
                Cotizar Proyecto
              </div>
            </div>
          </div>

          <ul className="space-y-2 text-left pt-4 border-t border-subtle/50 w-full px-1 mt-4 relative z-10">
            {[
              'Consultoría de negocio',
              'Desarrollos personalizados',
              'Multi-empresa flexible',
              'Integraciones nativas a medida'
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-500 leading-tight">
                <Check size={10} className="stroke-[3.5] text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{f}</span>
              </li>
            ))}
          </ul>
        </motion.button>
      </div>

      {/* Comparison Section Toggle */}
      <div className="flex justify-center pt-2 select-none">
        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors"
        >
          {showComparison ? 'Ocultar comparación de planes' : 'Comparar características de los planes'}
          <motion.div
            animate={{ rotate: showComparison ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </button>
      </div>

      {/* Comparison Table */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            ref={comparisonRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden w-full max-w-4xl mx-auto pt-2"
          >
            <div className="bg-surface-800 border border-subtle rounded-2xl overflow-x-auto p-4 shadow-modal no-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-subtle/80 pb-2">
                    <th className="py-2.5 font-black text-muted-500 uppercase tracking-wider text-[10px]">Característica</th>
                    <th className="py-2.5 font-bold text-brand-400 px-3">Standard</th>
                    <th className="py-2.5 font-bold text-success-400 px-3">Pro</th>
                    <th className="py-2.5 font-bold text-warning-400 px-3">360 (Empresarial)</th>
                    <th className="py-2.5 font-bold text-brand-300 px-3">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle/40 font-medium">
                  <tr>
                    <td className="py-3 font-semibold text-foreground">Límite de Trabajadores</td>
                    <td className="py-3 px-3 text-muted-400">1</td>
                    <td className="py-3 px-3 text-foreground">Hasta 10</td>
                    <td className="py-3 px-3 text-foreground">Hasta 30</td>
                    <td className="py-3 px-3 text-brand-400">Ilimitados</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-foreground">Facturación Electrónica</td>
                    <td className="py-3 px-3 text-muted-400">Básica</td>
                    <td className="py-3 px-3 text-foreground">Avanzada</td>
                    <td className="py-3 px-3 text-foreground">Ilimitada</td>
                    <td className="py-3 px-3 text-brand-400">A Medida</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-foreground">Dashboard y Analíticas</td>
                    <td className="py-3 px-3 text-muted-400">Básico</td>
                    <td className="py-3 px-3 text-foreground">Avanzado</td>
                    <td className="py-3 px-3 text-foreground">Multi-sucursal</td>
                    <td className="py-3 px-3 text-brand-400">Personalizado</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-foreground">Reportes PDF/Excel</td>
                    <td className="py-3 px-3 text-danger-500 font-bold">❌ No</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                    <td className="py-3 px-3 text-brand-400">A Medida</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-foreground">Gestión de Empleados</td>
                    <td className="py-3 px-3 text-danger-500 font-bold">❌ No</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-foreground">API Personalizada</td>
                    <td className="py-3 px-3 text-danger-500 font-bold">❌ No</td>
                    <td className="py-3 px-3 text-danger-500 font-bold">❌ No</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                    <td className="py-3 px-3 text-success-500 font-bold">✅ Sí</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-foreground">Soporte Técnico</td>
                    <td className="py-3 px-3 text-muted-400">Comunidad</td>
                    <td className="py-3 px-3 text-foreground">Prioritario</td>
                    <td className="py-3 px-3 text-foreground">Gerente 24/7</td>
                    <td className="py-3 px-3 text-brand-400">SLA Dedicado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
