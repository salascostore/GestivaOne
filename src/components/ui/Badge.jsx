import clsx from 'clsx'

const variants = {
  paid:    'bg-success-900/60 text-success-400 border border-success-500/30',
  pending: 'bg-warning-900/60 text-warning-400 border border-warning-500/30',
  overdue: 'bg-danger-900/60  text-danger-400  border border-danger-500/30',
  default: 'bg-surface-500 text-muted-500 border border-subtle',
}

const labels = {
  paid:    '✓ Pagado',
  pending: '● Pendiente',
  overdue: '⚠ Atrasado',
}

export default function Badge({ status = 'default', label, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
        variants[status] ?? variants.default,
        className
      )}
    >
      {label ?? labels[status] ?? status}
    </span>
  )
}
