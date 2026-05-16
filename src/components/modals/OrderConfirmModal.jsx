import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, CalendarDays, Zap, PartyPopper } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useCartStore, selectSubtotal } from '@/store/useCartStore'
import { useClientStore } from '@/store/useClientStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { format as dateFormat } from 'date-fns'

const TYPES = [
  { id: 'immediate', label: 'Inmediato', icon: Zap, desc: 'Pago recibido ahora', color: 'text-success-400' },
  { id: 'pending', label: 'Pendiente', icon: Clock, desc: 'Pago por confirmar', color: 'text-warning-400' },
  { id: 'scheduled', label: 'Programado', icon: CalendarDays, desc: 'Seleccionar fecha de cobro', color: 'text-brand-400' },
]

export default function OrderConfirmModal({ open }) {
  const [paymentType, setPaymentType] = useState('immediate')
  const [scheduledDate, setScheduledDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore(selectSubtotal)
  const clearCart = useCartStore((s) => s.clearCart)

  const client = useClientStore((s) => s.getSelected())

  const createInvoice = useInvoiceStore((s) => s.createInvoice)
  const closeModal = useUIStore((s) => s.closeModal)
  const format = useCurrencyStore((s) => s.format)

  const handleConfirm = async () => {
    if (paymentType === 'scheduled' && !scheduledDate) {
      toast.error('Selecciona una fecha de pago')
      return
    }
    const invoice = await createInvoice({
      client,
      items,
      subtotal,
      total: subtotal,
      paymentType,
      scheduledDate: scheduledDate || null,
    })

    if (!invoice) return toast.error('Error al generar factura')

    setConfirmed(true)
    setTimeout(() => {
      clearCart()
      setConfirmed(false)
      setPaymentType('immediate')
      setScheduledDate('')
      closeModal()
      toast.success(`Factura ${invoice.id} generada`)
    }, 2000)
  }

  const handleClose = () => {
    setConfirmed(false)
    closeModal()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Confirmar Pedido" size="md">
      <AnimatePresence mode="wait">
        {confirmed ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="w-16 h-16 rounded-full bg-success-500/20 border border-success-500/30 flex items-center justify-center"
            >
              <PartyPopper size={28} className="text-success-400" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-white">¡Pedido Confirmado!</p>
              <p className="text-sm text-muted-400 mt-1">Factura generada exitosamente</p>
            </div>
            <div className="text-2xl font-bold text-gradient">{format(subtotal)}</div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Client & total summary */}
            <div className="bg-surface-700 border border-subtle rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-400">Cliente</span>
                <span className="text-white font-medium">{client?.name ?? 'Express'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-400">Productos</span>
                <span className="text-white">{items.length} ítem(s)</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1 border-t border-subtle mt-2">
                <span className="text-white">Total</span>
                <span className="text-gradient">{format(subtotal)}</span>
              </div>
            </div>

            {/* Payment type */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-500 uppercase tracking-wide">Tipo de Pago</p>
              <div className="flex flex-col gap-2">
                {TYPES.map(({ id, label, icon: Icon, desc, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentType(id)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                      paymentType === id
                        ? 'border-brand-500 bg-brand-600/10'
                        : 'border-subtle bg-surface-700 hover:border-surface-300'
                    )}
                  >
                    <Icon size={18} className={paymentType === id ? color : 'text-muted-400'} />
                    <div>
                      <p className={clsx('text-sm font-semibold', paymentType === id ? 'text-white' : 'text-muted-400')}>{label}</p>
                      <p className="text-xs text-muted-400">{desc}</p>
                    </div>
                    {paymentType === id && (
                      <CheckCircle size={16} className="ml-auto text-brand-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled date picker */}
            <AnimatePresence>
              {paymentType === 'scheduled' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="Fecha de pago programado"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={dateFormat(new Date(), 'yyyy-MM-dd')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" size="md" className="flex-1" onClick={handleClose}>Cancelar</Button>
              <Button variant="primary" size="md" className="flex-1" onClick={handleConfirm}>
                Confirmar Pedido
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
