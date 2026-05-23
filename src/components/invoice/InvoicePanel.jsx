import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, ChevronDown, FileText, User, X, Check } from 'lucide-react'
import { useCartStore, selectSubtotal } from '@/store/useCartStore'
import { useClientStore } from '@/store/useClientStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore } from '@/store/useAuthStore'
import Button from '@/components/ui/Button'

const TAX_RATES = {
  COP: 0.19,
  MXN: 0.16,
  USD: 0.0,
  EUR: 0.21,
  ARS: 0.21,
  CLP: 0.19,
  PEN: 0.18,
  CRC: 0.13,
  DOP: 0.18,
}
import clsx from 'clsx'

export default function InvoicePanel({ isMobile }) {
  const items       = useCartStore((s) => s.items)
  const removeItem  = useCartStore((s) => s.removeItem)
  const updateQty   = useCartStore((s) => s.updateQty)
  const clearCart   = useCartStore((s) => s.clearCart)
  const subtotal    = useCartStore(selectSubtotal)
  const includeTax  = useCartStore((s) => s.includeTax)
  const toggleTax   = useCartStore((s) => s.toggleTax)

  const baseCurrency = useCurrencyStore((s) => s.baseCurrency)
  const taxRate = TAX_RATES[baseCurrency] ?? 0.0
  const taxAmount = includeTax ? subtotal * taxRate : 0
  const total = subtotal + taxAmount

  const selectedClient = useClientStore((s) => s.getSelected())
  const clearClientSel = useClientStore((s) => s.clearSelection)

  const panelOpen  = useUIStore((s) => s.invoicePanelOpen)
  const togglePanel = useUIStore((s) => s.toggleInvoicePanel)
  const openModal  = useUIStore((s) => s.openModal)

  const format = useCurrencyStore((s) => s.format)
  const canOrder = items.length > 0

  // ─────────────────────────────────────────
  // MOBILE: Bottom sheet drawer
  // ─────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {panelOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="invoice-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={togglePanel}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />
              {/* Bottom sheet */}
              <motion.aside
                key="invoice-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-surface-800 border-t border-subtle rounded-t-3xl flex flex-col"
                style={{ maxHeight: '85vh' }}
              >
                {/* Drag handle + header */}
                <div className="flex flex-col shrink-0">
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-surface-500" />
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-subtle">
                    <FileText size={16} className="text-brand-400" />
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400 flex-1">Factura en Tiempo Real</span>
                    {items.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="p-1.5 rounded-lg text-muted-400 hover:text-danger-400 hover:bg-danger-900/30 transition-colors"
                        title="Limpiar carrito"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={togglePanel}
                      className="p-1.5 rounded-lg text-muted-400 hover:text-foreground hover:bg-surface-600 transition-colors"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>

                {/* Client */}
                <div className="px-5 py-3 border-b border-subtle shrink-0">
                  {selectedClient ? (
                    <div className="flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center shrink-0">
                        <User size={12} className="text-brand-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{selectedClient.name}</p>
                        <p className="text-[10px] text-muted-400 truncate">{selectedClient.email || 'Sin correo'}</p>
                      </div>
                      <button onClick={clearClientSel} className="text-muted-400 hover:text-foreground">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-400 text-center py-1">Sin cliente seleccionado</p>
                  )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-surface-600 flex items-center justify-center">
                          <ShoppingCart size={20} className="text-muted-400" />
                        </div>
                        <p className="text-xs text-muted-400">El carrito está vacío.</p>
                      </div>
                    ) : (
                      items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 12 }}
                          className="bg-surface-700 border border-subtle rounded-xl p-3"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                              <p className="text-[11px] text-muted-400">{format(item.price)} / {item.unit}</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-muted-400 hover:text-danger-400 p-0.5">
                              <X size={11} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-md bg-surface-500 hover:bg-surface-400 flex items-center justify-center text-white transition-colors">
                                <Minus size={10} />
                              </button>
                              <span className="text-xs font-semibold text-foreground w-6 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded-md bg-surface-500 hover:bg-surface-400 flex items-center justify-center text-white transition-colors">
                                <Plus size={10} />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-foreground">{format(item.price * item.qty)}</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-subtle shrink-0 space-y-3 pb-safe">
                  <div className="flex justify-between text-xs text-muted-400">
                    <span>Subtotal</span>
                    <span className="text-foreground font-medium">{format(subtotal)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-400">
                      <div onClick={toggleTax} className="flex items-center gap-2 cursor-pointer group">
                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors", includeTax ? "bg-brand-500 border-brand-500" : "bg-surface-700 border-subtle group-hover:border-surface-400")}>
                          {includeTax && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={clsx("transition-colors select-none", includeTax ? "text-foreground font-semibold" : "text-muted-400 group-hover:text-muted-500")}>
                          IVA ({(taxRate * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <span className="text-foreground font-medium">{format(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-foreground">
                    <span>Total</span>
                    <span>{format(total)}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={!canOrder}
                    onClick={() => openModal('orderConfirm')}
                  >
                    Realizar Pedido
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ─────────────────────────────────────────
  // DESKTOP: Side panel (original layout)
  // ─────────────────────────────────────────
  return (
    <>
      {/* Toggle tab */}
      <motion.button
        onClick={togglePanel}
        animate={{ right: panelOpen ? 284 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="fixed top-1/2 -translate-y-1/2 z-20 bg-surface-700 border border-subtle rounded-l-xl px-1.5 py-4 text-muted-400 hover:text-foreground hover:bg-surface-600 transition-colors"
      >
        <motion.div animate={{ rotate: panelOpen ? 0 : 180 }}>
          <ChevronRight size={14} />
        </motion.div>
        {items.length > 0 && (
          <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-brand-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </motion.button>

      {/* Panel with smooth spring width animation */}
      <motion.aside
        animate={{ width: panelOpen ? 288 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={clsx(
          "h-screen bg-surface-800 flex flex-col overflow-hidden shrink-0 z-10",
          panelOpen ? "border-l border-subtle" : "border-l-0"
        )}
      >
        {/* Fixed-width content container prevents text squishing during collapse */}
        <div className="w-[288px] h-full flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 h-16 border-b border-subtle shrink-0">
            <FileText size={16} className="text-brand-400" />
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400 flex-1 whitespace-nowrap">Factura en Tiempo Real</span>
            {items.length > 0 && (
              <button onClick={clearCart} className="p-1.5 rounded-lg text-muted-400 hover:text-danger-400 hover:bg-danger-900/30 transition-colors shrink-0" title="Limpiar carrito">
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Client */}
          <div className="px-4 py-3 border-b border-subtle shrink-0">
            {selectedClient ? (
              <div className="flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center shrink-0">
                  <User size={12} className="text-brand-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{selectedClient.name}</p>
                  <p className="text-[10px] text-muted-400 truncate">{selectedClient.email || 'Sin correo'}</p>
                </div>
                <button onClick={clearClientSel} className="text-muted-400 hover:text-foreground shrink-0">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-400 text-center py-1">Sin cliente seleccionado</p>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {items.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full gap-3 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface-600 flex items-center justify-center shrink-0">
                    <ShoppingCart size={20} className="text-muted-400" />
                  </div>
                  <p className="text-xs text-muted-400">El carrito está vacío.<br/>Añade productos desde el panel.</p>
                </motion.div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="bg-surface-700 border border-subtle rounded-xl p-3 shrink-0"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-400">{format(item.price)} / {item.unit}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-muted-400 hover:text-danger-400 transition-colors p-0.5 shrink-0">
                        <X size={11} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-5 h-5 rounded-md bg-surface-500 hover:bg-surface-400 flex items-center justify-center text-white transition-colors shrink-0">
                          <Minus size={9} />
                        </button>
                        <span className="text-xs font-semibold text-foreground w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-5 h-5 rounded-md bg-surface-500 hover:bg-surface-400 flex items-center justify-center text-white transition-colors shrink-0">
                          <Plus size={9} />
                        </button>
                      </div>
                      <motion.span
                        key={`${item.id}-${item.qty}-${item.price}`}
                        initial={{ scale: 1.1, color: '#a78bfa' }}
                        animate={{ scale: 1, color: 'var(--text-foreground)' }}
                        className="text-xs font-bold shrink-0"
                      >
                        {format(item.price * item.qty)}
                      </motion.span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-subtle shrink-0 space-y-3">
            <div className="flex justify-between text-xs text-muted-400">
              <span>Subtotal</span>
              <span className="text-foreground font-medium">{format(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-400">
                <div onClick={toggleTax} className="flex items-center gap-2 cursor-pointer group">
                  <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors", includeTax ? "bg-brand-500 border-brand-500" : "bg-surface-700 border-subtle group-hover:border-surface-400")}>
                    {includeTax && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={clsx("transition-colors select-none", includeTax ? "text-foreground font-semibold" : "text-muted-400 group-hover:text-muted-500")}>
                    IVA ({(taxRate * 100).toFixed(0)}%)
                  </span>
                </div>
                <span className="text-foreground font-medium">{format(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <motion.span
                key={total}
                initial={{ scale: 1.05, color: '#a78bfa' }}
                animate={{ scale: 1, color: 'var(--text-foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {format(total)}
              </motion.span>
            </div>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={!canOrder}
              onClick={() => openModal('orderConfirm')}
            >
              Realizar Pedido
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
