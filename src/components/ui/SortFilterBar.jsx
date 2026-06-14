import { motion } from 'framer-motion'
import { Clock, Hash, AlignLeft } from 'lucide-react'
import clsx from 'clsx'

/**
 * SortFilterBar
 * 
 * Props:
 *  - sortMode: 'recent' | 'id' | 'letter'
 *  - onSortChange: (mode) => void
 *  - activeLetter: string | null  (only used when sortMode === 'letter')
 *  - onLetterChange: (letter | null) => void
 *  - letters: string[]  — list of unique first-letters present in data
 */
export default function SortFilterBar({
  sortMode = 'recent',
  onSortChange,
  activeLetter = null,
  onLetterChange,
  letters = [],
}) {
  const MODES = [
    { key: 'recent', icon: Clock,    label: 'Recientes' },
    { key: 'id',     icon: Hash,     label: 'Por #' },
    { key: 'letter', icon: AlignLeft, label: 'A–Z' },
  ]

  return (
    <div className="flex flex-col gap-2">
      {/* Mode pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {MODES.map(({ key, icon: Icon, label }) => {
          const active = sortMode === key
          return (
            <motion.button
              key={key}
              onClick={() => onSortChange(key)}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 border',
                active
                  ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-foreground hover:border-surface-500'
              )}
            >
              <Icon size={12} />
              {label}
              {active && (
                <motion.span
                  layoutId="sort-pill"
                  className="absolute inset-0 rounded-lg bg-brand-600"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Letter strip — only shows when mode === 'letter' */}
      {sortMode === 'letter' && letters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1"
        >
          <button
            onClick={() => onLetterChange(null)}
            className={clsx(
              'w-7 h-7 rounded-md text-[11px] font-black shrink-0 transition-colors border',
              !activeLetter
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-foreground'
            )}
          >
            ∗
          </button>
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => onLetterChange(activeLetter === letter ? null : letter)}
              className={clsx(
                'w-7 h-7 rounded-md text-[11px] font-black shrink-0 transition-colors border uppercase',
                activeLetter === letter
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-foreground'
              )}
            >
              {letter}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}
