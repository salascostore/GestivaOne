import { Menu, FileText } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useCartStore } from '@/store/useCartStore'
import { motion } from 'framer-motion'

export default function TopBar() {
  const openMobileSidebar  = useUIStore((s) => s.openMobileSidebar)
  const toggleInvoicePanel = useUIStore((s) => s.toggleInvoicePanel)
  const invoiceOpen        = useUIStore((s) => s.invoicePanelOpen)
  const cartCount          = useCartStore((s) => s.items.length)

  return (
    <header className="h-14 shrink-0 bg-surface-800 border-b border-subtle flex items-center justify-between px-4 z-30">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={openMobileSidebar}
          className="p-2 rounded-xl text-muted-400 hover:text-white hover:bg-surface-600 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Gestiva</span>
          <span className="text-[10px] text-brand-400 font-medium tracking-widest uppercase">One</span>
        </div>
      </div>

      {/* Right: invoice toggle button */}
      <button
        onClick={toggleInvoicePanel}
        className="relative p-2 rounded-xl text-muted-400 hover:text-white hover:bg-surface-600 transition-colors"
        aria-label="Abrir factura"
      >
        <FileText size={18} />
        {cartCount > 0 && (
          <motion.span
            key={cartCount}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold"
          >
            {cartCount}
          </motion.span>
        )}
      </button>
    </header>
  )
}
