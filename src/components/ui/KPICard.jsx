import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function KPICard({ title, value, subtitle, icon, trend, color = 'brand', loading = false, collapsed = false }) {
  const colors = {
    brand:   'from-brand-600/20 to-brand-800/10 border-brand-500/20',
    success: 'from-success-500/20 to-success-900/10 border-success-500/20',
    warning: 'from-warning-500/20 to-warning-900/10 border-warning-500/20',
    danger:  'from-danger-500/20 to-danger-900/10  border-danger-500/20',
  }
  const iconColors = {
    brand: 'text-brand-400 bg-brand-500/10',
    success: 'text-success-400 bg-success-500/10',
    warning: 'text-warning-400 bg-warning-500/10',
    danger:  'text-danger-400 bg-danger-500/10',
  }

  return (
    <motion.div
      whileHover={collapsed ? undefined : { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
      className={clsx(
        'relative overflow-hidden bg-gradient-to-br border rounded-2xl p-4 sm:p-5 transition-all duration-300 ease-in-out h-full flex flex-col justify-center select-none',
        colors[color],
        collapsed ? 'items-center justify-center p-3 border-subtle bg-surface-800/40' : ''
      )}
    >
      <div className={clsx("flex items-center justify-between gap-2.5 w-full", collapsed && "justify-center")}>
        <div className={clsx(
          "flex-1 min-w-0 transition-all duration-300 ease-in-out origin-left",
          collapsed ? "w-0 opacity-0 pointer-events-none scale-75 overflow-hidden" : "w-full opacity-100 scale-100"
        )}>
          <p className="text-[10px] sm:text-xs text-muted-400 uppercase tracking-wider font-semibold mb-1 truncate">{title}</p>
          {loading
            ? <div className="h-7 w-24 bg-surface-400 rounded animate-pulse" />
            : <p className="text-base sm:text-xl xl:text-2xl font-black text-white truncate">{value}</p>
          }
          {subtitle && <p className="text-[10px] sm:text-xs text-muted-400 mt-1 truncate">{subtitle}</p>}
        </div>
        {icon && (
          <div className={clsx(
            'rounded-xl shrink-0 transition-all duration-500 ease-out-expo',
            iconColors[color],
            collapsed ? 'p-3 scale-110' : 'p-2 sm:p-2.5'
          )}>
            {icon}
          </div>
        )}
      </div>
      {!collapsed && trend !== undefined && (
        <div className={clsx('flex items-center gap-1 mt-3 text-[10px] sm:text-xs font-medium', trend >= 0 ? 'text-success-400' : 'text-danger-400')}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span className="text-muted-400 font-normal">vs mes anterior</span>
        </div>
      )}
      {/* Decorative blur blob */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-current pointer-events-none" />
    </motion.div>
  )
}
