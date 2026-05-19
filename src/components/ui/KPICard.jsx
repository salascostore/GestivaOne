import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function KPICard({ title, value, subtitle, icon, trend, color = 'brand', loading = false, collapsed = false }) {
  const colors = {
    brand:   'from-brand-500 to-brand-700 border-white/10 text-white shadow-glow-sm',
    success: 'from-success-500 to-emerald-600 border-white/10 text-white',
    warning: 'from-amber-500 to-warning-600 border-white/10 text-white',
    danger:  'from-danger-500 to-red-600 border-white/10 text-white',
  }

  const premiumTransition = {
    transition: 'all 850ms cubic-bezier(0.4, 0, 0.2, 1)'
  }

  return (
    <motion.div
      whileHover={collapsed ? undefined : { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
      className={clsx(
        'relative overflow-hidden bg-gradient-to-br border rounded-2xl p-4 sm:p-5 h-full flex flex-col justify-center select-none',
        colors[color],
        collapsed ? 'items-center justify-center p-3 border-subtle bg-surface-700/50 backdrop-blur-sm' : ''
      )}
      style={premiumTransition}
    >
      <div className={clsx("flex items-center justify-between gap-2.5 w-full", collapsed && "justify-center")}>
        {icon && (
          <div 
            className={clsx(
              'rounded-xl shrink-0 flex items-center justify-center text-white bg-white/15 backdrop-blur-sm',
              collapsed ? 'w-12 h-12 scale-110' : 'w-10 h-10'
            )}
            style={premiumTransition}
          >
            {icon}
          </div>
        )}
        <div 
          className={clsx(
            "min-w-0 text-right origin-right",
            collapsed ? "w-0 opacity-0 pointer-events-none scale-75 overflow-hidden" : "flex-1 opacity-100 scale-100"
          )}
          style={premiumTransition}
        >
          <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wider font-bold mb-1 truncate" title={title}>{title}</p>
          {loading
            ? <div className="h-7 w-24 bg-surface-400 rounded animate-pulse ml-auto" />
            : <p 
                className="text-base sm:text-xl xl:text-2xl font-black text-white truncate cursor-help hover:text-white/90 transition-colors" 
                title={value}
              >
                {value}
              </p>
          }
          {subtitle && <p className="text-[10px] sm:text-xs text-white/70 mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
      {!collapsed && trend !== undefined && (
        <div className={clsx('flex items-center gap-1 mt-3 text-[10px] sm:text-xs font-semibold text-white')}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span className="text-white/70 font-normal">vs mes anterior</span>
        </div>
      )}
      {/* Decorative blur blob */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-10 bg-white pointer-events-none" />
    </motion.div>
  )
}
