import { motion } from 'framer-motion'
import { Zap, Star, Building2, Check } from 'lucide-react'
import { PLANS } from '@/store/useAuthStore'
import clsx from 'clsx'

const glows = {
  standard: 'glow-top-brand border-brand-500/10 hover:border-brand-500/30',
  pro: 'glow-top-success border-success-500/10 hover:border-success-500/30',
  empresarial: 'glow-top-warning border-warning-500/10 hover:border-warning-500/30',
}

const badgeStyles = {
  standard: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
  pro: 'bg-success-500/10 border-success-500/20 text-success-400',
  empresarial: 'bg-warning-500/10 border-warning-500/20 text-warning-400',
}

export default function PlanSelector({ selected, onSelect }) {
  const plans = Object.values(PLANS).filter(p => p.id !== 'master')

  return (
    <div className="space-y-4">
      <div className="text-center space-y-0.5 mb-4">
        <h2 className="text-lg md:text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wider">
          Elige tu plan comercial
        </h2>
        <p className="text-[11px] text-muted-500">
          Selecciona el plan ideal para expandir tu negocio. Cambia o cancela cuando quieras.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selected === plan.id
          const activeGlow = glows[plan.id] || glows.standard
          const activeBadge = badgeStyles[plan.id] || badgeStyles.standard

          return (
            <motion.button
              key={plan.id}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(plan.id)}
              className={clsx(
                'group relative w-full text-left border rounded-2xl p-4 transition-all duration-500 ease-out-expo flex flex-col justify-between min-h-[300px] bg-surface-800/85 backdrop-blur-md overflow-hidden select-none',
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/10 shadow-glow'
                  : 'border-subtle/50 hover:border-surface-400'
              )}
            >
              {/* Concentric Glow Top Effect */}
              <div className={clsx('absolute inset-0 pointer-events-none rounded-3xl', activeGlow)} />

              {plan.popular && (
                <span className="absolute -top-0 right-6 bg-success-500 text-white text-[8px] font-black px-3 py-1 rounded-b-xl flex items-center gap-1 shadow-sm uppercase tracking-wider z-10">
                  <Star size={8} fill="currentColor" /> RECOMENDADO
                </span>
              )}
              
              <div className="space-y-4 w-full relative z-10">
                <div className="flex items-center gap-3">
                  {/* Concentric nested icon wrapper */}
                  <div className={clsx(
                    'w-9 h-9 rounded-lg shrink-0 border flex items-center justify-center transition-all duration-500 ease-out-expo', 
                    activeBadge
                  )}>
                    {plan.id === 'empresarial' ? <Building2 size={16} /> : <Zap size={16} />}
                  </div>
                  <div>
                    <p className="font-extrabold text-neutral-900 dark:text-white text-sm tracking-tight leading-none">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      {plan.promoPrice ? (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-brand-400 font-black text-lg">{plan.promoPriceDisplay}</span>
                            <span className="text-[10px] text-muted-500 line-through font-bold">{plan.priceDisplay}</span>
                          </div>
                          <span className="text-[8px] font-extrabold tracking-wider uppercase bg-success-500/15 text-success-400 px-1.5 py-0.2 rounded-full mt-0.5 w-max border border-success-500/10">
                            {plan.promoLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-900 dark:text-white font-black text-lg">{plan.priceDisplay}</span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-500 dark:text-muted-400 block mt-0.5 font-bold lowercase tracking-wider leading-none">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-left border-t border-subtle/50 dark:border-subtle/30 pt-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-neutral-800 dark:text-neutral-300 leading-tight">
                      <div className={clsx(
                        "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border",
                        isSelected ? 'bg-brand-500/20 border-brand-500/30 text-brand-400' : 'bg-surface-700/50 border-subtle text-muted-500'
                      )}>
                        <Check size={8} className="stroke-[3]" />
                      </div>
                      <span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Styled pill-shaped indicator matching image 3 (Get started buttons) */}
              <div className="w-full mt-4 relative z-10">
                <div className={clsx(
                  'w-full py-2.5 px-4 rounded-full text-xs font-black text-center transition-all duration-500 ease-out-expo select-none border',
                  isSelected 
                    ? 'bg-brand-600 text-white border-brand-500/40 shadow-glow-sm' 
                    : 'bg-surface-700/60 text-muted-400 border-subtle/40 group-hover:bg-surface-700 group-hover:text-white group-hover:border-surface-400'
                )}>
                  {isSelected ? 'Plan Activo ✓' : 'Elegir Plan'}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
