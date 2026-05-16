import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm hover:shadow-glow',
  secondary: 'bg-surface-500 hover:bg-surface-400 text-white border border-subtle',
  ghost: 'bg-transparent hover:bg-surface-500 text-muted-500 hover:text-white',
  danger: 'bg-danger-900 hover:bg-danger-500 text-danger-400 hover:text-white border border-danger-500/30',
  success: 'bg-success-900 hover:bg-success-500 text-success-400 hover:text-white border border-success-500/30',
  outline: 'bg-transparent border border-brand-600 text-brand-400 hover:bg-brand-600 hover:text-white',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  icon,
  iconRight,
  disabled,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon}
      {children}
      {!loading && iconRight}
    </motion.button>
  )
})

Button.displayName = 'Button'
export default Button
