import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, CalendarDays, Zap, PartyPopper } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useCartStore, selectSubtotal } from '@/store/useCartStore'
import { useClientStore } from '@/store/useClientStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { usePocketStore } from '@/store/usePocketStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { printInvoice } from '@/services/printService'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { format as dateFormat } from 'date-fns'

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

const TYPES = [
  { id: 'immediate', label: 'Inmediato', icon: Zap, desc: 'Pago recibido ahora', color: 'text-success-400' },
  { id: 'pending', label: 'Pendiente', icon: Clock, desc: 'Pago por confirmar', color: 'text-warning-400' },
  { id: 'scheduled', label: 'Programado', icon: CalendarDays, desc: 'Seleccionar fecha de cobro', color: 'text-brand-400' },
]

export default function OrderConfirmModal({ open }) {
  const [paymentType, setPaymentType] = useState('immediate')
  const [scheduledDate, setScheduledDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore(selectSubtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const includeTax = useCartStore((s) => s.includeTax)

  const baseCurrency = useCurrencyStore((s) => s.baseCurrency)
  const taxRate = TAX_RATES[baseCurrency] ?? 0.0
  const taxAmount = useCartStore((s) => s.taxAmount)
  const total = useCartStore((s) => s.total)
  const customCharges = useCartStore((s) => s.customCharges)

  const client = useClientStore((s) => s.getSelected())
  const user = useAuthStore((s) => s.user)

  const createInvoice = useInvoiceStore((s) => s.createInvoice)
  const closeModal = useUIStore((s) => s.closeModal)
  const format = useCurrencyStore((s) => s.format)

  const pockets = usePocketStore((s) => s.pockets)
  const fetchPockets = usePocketStore((s) => s.fetchPockets)
  const [destinationPocketId, setDestinationPocketId] = useState('general')

  useEffect(() => {
    if (open) {
      fetchPockets()
    }
  }, [open, fetchPockets])

  const handleConfirm = async () => {
    if (paymentType === 'scheduled' && !scheduledDate) {
      toast.error('Selecciona una fecha de pago')
      return
    }
    if (loading) return
    setLoading(true)
    
    try {
      const invoice = await createInvoice({
        client,
        items,
        subtotal,
        total,
        paymentType,
        scheduledDate: scheduledDate || null,
        taxAmount,
        taxRate: includeTax ? taxRate : 0,
        pocketId: destinationPocketId,
        note: JSON.stringify({
          notes: '',
          payments: [],
          custom_charges: customCharges.filter(c => c.applied).map(({ name, type, value }) => ({ name, type, value })),
          pocket_id: destinationPocketId
        })
      })

      if (!invoice) {
        setLoading(false)
        return toast.error('Error al generar factura')
      }

      // Trigger integrations and automatic printing
      const { smtp, whatsapp, printer } = useSettingsStore.getState()
      
      if (smtp?.enabled) {
        const emailTarget = client?.email || 'correo-cliente@express.com'
        toast.success(`📧 Enviando factura a ${emailTarget} vía SMTP...`, { duration: 3000 })
      }
      
      if (whatsapp?.enabled) {
        const phoneTarget = client?.phone || 'teléfono cliente'
        toast.success(`💬 Enviando recibo a ${phoneTarget} por WhatsApp...`, { duration: 3000 })
      }

      if (printer?.autoPrint) {
        printInvoice(invoice, client, {
          ...printer,
          companyName: user?.companyName || 'GestivaOne',
          companyLogo: user?.companyLogo || null
        })
      }

      setConfirmed(true)
      setTimeout(() => {
        clearCart()
        setConfirmed(false)
        setPaymentType('immediate')
        setScheduledDate('')
        closeModal()
        toast.success(`Factura ${invoice.id?.slice(-8).toUpperCase()} generada`)
        setLoading(false)
      }, 2000)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
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
              <p className="text-lg font-bold text-foreground">¡Pedido Confirmado!</p>
              <p className="text-sm text-muted-400 mt-1">Factura generada exitosamente</p>
            </div>
            <div className="text-2xl font-bold text-gradient">{format(total)}</div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Client & total summary */}
            <div className="bg-surface-700 border border-subtle rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-400">Cliente</span>
                <span className="text-foreground font-medium">{client?.name ?? 'Express'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-400">Productos</span>
                <span className="text-foreground">{items.length} ítem(s)</span>
              </div>
              {includeTax && taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-400">IVA ({(taxRate * 100).toFixed(0)}%)</span>
                  <span className="text-foreground">{format(taxAmount)}</span>
                </div>
              )}
              {customCharges.filter(c => c.applied).map((c) => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="text-muted-400">{c.name} {c.type === 'percent' ? `(${c.value}%)` : ''}</span>
                  <span className="text-foreground">
                    {c.type === 'percent' ? format(subtotal * (c.value / 100)) : format(c.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-subtle mt-2">
                <span className="text-foreground">Total</span>
                <span className="text-gradient">{format(total)}</span>
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
                      <p className={clsx('text-sm font-semibold', paymentType === id ? 'text-brand-600 dark:text-white' : 'text-muted-400')}>{label}</p>
                      <p className="text-xs text-muted-400">{desc}</p>
                    </div>
                    {paymentType === id && (
                      <CheckCircle size={16} className="ml-auto text-brand-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pocket select */}
            {paymentType === 'immediate' && pockets.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-300 block">Destino de los Fondos (Venta Inmediata)</label>
                <select
                  value={destinationPocketId}
                  onChange={(e) => setDestinationPocketId(e.target.value)}
                  className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                >
                  <option value="general">Utilidad Neta Real (General)</option>
                  {pockets.map(p => (
                    <option key={p.id} value={p.id}>Bolsillo: {p.name} (Saldo: {format(p.balance)})</option>
                  ))}
                </select>
              </div>
            )}

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
              <Button variant="primary" size="md" className="flex-1" onClick={handleConfirm} loading={loading}>
                Confirmar Pedido
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
