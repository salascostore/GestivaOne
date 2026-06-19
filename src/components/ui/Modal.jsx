import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
}

// Desktop: scale-in from center
const desktopVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } },
}

// Mobile: slide up from bottom
const mobileVariants = {
  hidden:  { opacity: 1, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 38 } },
  exit:    { opacity: 1, y: '100%', transition: { duration: 0.2 } },
}

export default function Modal({ open, onClose, title, children, size = 'md', hideClose = false }) {
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        >
          {/* Mobile: full-width bottom sheet | Desktop: centered card */}
          <motion.div
            key="modal-content"
            variants={desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`
              relative w-full bg-surface-700 border border-subtle shadow-modal overflow-hidden
              rounded-t-[32px] sm:rounded-3xl
              ${widths[size]}
            `}
          >
            {/* Drag handle on mobile (appears at the very top of bottom sheets) */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-surface-500" />
            </div>

            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-subtle">
                {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1.5 rounded-lg text-muted-400 hover:text-foreground hover:bg-surface-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            {/* Body */}
            <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
