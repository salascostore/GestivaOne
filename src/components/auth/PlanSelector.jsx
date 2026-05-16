import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Star, Building2, Check } from 'lucide-react'
import { PLANS } from '@/store/useAuthStore'
import clsx from 'clsx'

export default function PlanSelector({ selected, onSelect }) {
  const plans = Object.values(PLANS).filter(p => p.id !== 'master')

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-xl font-bold text-white">Elige tu plan</h2>
        <p className="text-sm text-muted-400">Cambia o cancela cuando quieras</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {plans.map((plan) => {
          const isSelected = selected === plan.id
          return (
            <motion.button
              key={plan.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(plan.id)}
              className={clsx(
                'relative w-full text-left border-2 rounded-2xl p-4 transition-all',
                isSelected
                  ? 'border-brand-500 bg-brand-600/10'
                  : 'border-subtle bg-surface-700 hover:border-surface-300'
              )}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-4 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={9} fill="currentColor" /> MÁS POPULAR
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={clsx('p-2 rounded-xl', isSelected ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-500 text-muted-400')}>
                    {plan.id === 'empresarial' ? <Building2 size={18} /> : <Zap size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{plan.name}</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      {plan.promoPrice ? (
                        <>
                          <span className="text-brand-300 font-bold text-base">{plan.promoPriceDisplay}</span>
                          <span className="text-[10px] text-muted-400 line-through">{plan.priceDisplay}</span>
                          <span className="text-[10px] bg-success-900 text-success-400 px-1.5 py-0.5 rounded font-bold">{plan.promoLabel}</span>
                        </>
                      ) : (
                        <span className="text-white font-bold text-base">{plan.priceDisplay}</span>
                      )}
                      <span className="text-[11px] text-muted-400">{plan.period}</span>
                    </div>
                  </div>
                </div>
                <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all', isSelected ? 'border-brand-500 bg-brand-500' : 'border-surface-400')}>
                  {isSelected && <Check size={11} className="text-white" />}
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-400">
                    <Check size={9} className={isSelected ? 'text-brand-400' : 'text-muted-500'} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
