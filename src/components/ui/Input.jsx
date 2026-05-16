import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({
  label,
  error,
  icon,
  iconRight,
  className,
  containerClassName,
  hint,
  ...props
}, ref) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-surface-700 border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-400 outline-none transition-all duration-150',
            'focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            error
              ? 'border-danger-500 focus:ring-danger-500/50'
              : 'border-subtle hover:border-surface-300',
            icon && 'pl-9',
            iconRight && 'pr-9',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-400">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-400">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
