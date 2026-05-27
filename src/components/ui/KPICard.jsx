import { motion } from 'framer-motion'
import clsx from 'clsx'

const cardGlows = {
  brand:   'glow-top-brand border-brand-500/15 hover:border-brand-500/30',
  success: 'glow-top-success border-success-500/15 hover:border-success-500/30',
  warning: 'glow-top-warning border-warning-500/15 hover:border-warning-500/30',
  danger:  'glow-top-danger border-danger-500/15 hover:border-danger-500/30',
}

const iconStyles = {
  brand:   'bg-brand-600/10 text-brand-400 border-brand-500/20',
  success: 'bg-success-500/10 text-success-400 border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
  danger:  'bg-danger-500/10 text-danger-400 border-danger-500/20',
}

const textColors = {
  brand:   'text-brand-400',
  success: 'text-success-400',
  warning: 'text-warning-400',
  danger:  'text-danger-400',
}

export default function KPICard({ title, value, subtitle, icon, trend, color = 'brand', loading = false, collapsed = false }) {
  
  const isTrendPositive = trend >= 0

  return (
    <motion.div
      whileHover={collapsed ? undefined : { y: -3, scale: 1.01 }}
      className={clsx(
        'relative overflow-hidden bg-surface-800/80 backdrop-blur-md border rounded-3xl p-3 flex flex-col justify-center select-none transition-all duration-500 ease-out-expo',
        cardGlows[color],
        collapsed && 'items-center justify-center border-subtle bg-surface-700/40'
      )}
    >
      <div className={clsx("flex items-center justify-between gap-3 w-full p-2", collapsed && "justify-center p-0")}>
        {icon && (
          <div 
            className={clsx(
              'rounded-xl shrink-0 flex items-center justify-center border transition-all duration-500 ease-out-expo',
              iconStyles[color],
              collapsed ? 'w-12 h-12 scale-110' : 'w-10 h-10'
            )}
          >
            {icon}
          </div>
        )}
        <div 
          className={clsx(
            "min-w-0 text-right origin-right transition-all duration-500 ease-out-expo",
            collapsed ? "w-0 opacity-0 pointer-events-none scale-75 overflow-hidden" : "flex-1 opacity-100 scale-100"
          )}
        >
          <p className="text-[10px] sm:text-xs text-muted-400 uppercase tracking-wider font-extrabold mb-1 truncate" title={title}>
            {title}
          </p>
          {loading ? (
            <div className="h-7 w-24 bg-surface-700 rounded-lg animate-pulse ml-auto" />
          ) : (
            <p 
              className="text-base sm:text-lg xl:text-xl font-black text-foreground truncate cursor-help hover:text-foreground/90 transition-colors" 
              title={value}
            >
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] text-muted-500 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {!collapsed && trend !== undefined && (
        <div className="flex items-center justify-end gap-1 mt-2.5 px-2 text-[10px] sm:text-xs font-bold leading-none select-none">
          <span className={clsx(isTrendPositive ? 'text-success-400' : 'text-danger-400')}>
            {isTrendPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-muted-500 font-medium">vs mes anterior</span>
        </div>
      )}
      
      {/* Subtle bottom-right glass background blob */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl opacity-[0.02] bg-white pointer-events-none" />
    </motion.div>
  )
}
