import { useMemo } from 'react'
import { FileText, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useUIStore } from '@/store/useUIStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

function StatusBadge({ status }) {
  const cfg = {
    paid:    { label: 'Pagada',    color: 'bg-success-500/10 text-success-400 border-success-500/20', icon: CheckCircle },
    pending: { label: 'Pendiente', color: 'bg-warning-500/10 text-warning-400 border-warning-500/20', icon: Clock },
    overdue: { label: 'Atrasada',  color: 'bg-danger-500/10  text-danger-400  border-danger-500/20',  icon: AlertTriangle },
  }[status] || { label: 'Desconocido', color: 'bg-surface-600 text-muted-400 border-subtle', icon: FileText }

  const Icon = cfg.icon

  return (
    <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider', cfg.color)}>
      <Icon size={12} />
      {cfg.label}
    </div>
  )
}

export default function ClientHistoryModal({ open }) {
  const closeModal    = useUIStore((s) => s.closeModal)
  const client        = useUIStore((s) => s.editingClient)
  const invoices      = useInvoiceStore((s) => s.invoices)
  const format$       = useCurrencyStore((s) => s.format)

  const clientInvoices = useMemo(() => {
    if (!client) return []
    return invoices
      .filter((i) => i.client_id === client.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [invoices, client])

  if (!client) return null

  const totalSpent = clientInvoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalDebt  = clientInvoices.filter(i => i.payment_status !== 'paid').reduce((s, i) => s + i.total, 0)

  return (
    <Modal open={open} onClose={closeModal} title={`Historial: ${client.name}`} size="md">
      <div className="space-y-4">
        {/* Summary Header */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-700/50 border border-subtle rounded-xl p-3">
            <p className="text-[10px] text-muted-400 font-bold uppercase tracking-widest mb-1">Total Pagado</p>
            <p className="text-lg font-bold text-success-400">{format$(totalSpent)}</p>
          </div>
          <div className="bg-surface-700/50 border border-subtle rounded-xl p-3">
            <p className="text-[10px] text-muted-400 font-bold uppercase tracking-widest mb-1">Deuda Pendiente</p>
            <p className="text-lg font-bold text-danger-400">{format$(totalDebt)}</p>
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {clientInvoices.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={32} className="text-muted-500 mx-auto mb-3" />
              <p className="text-sm text-muted-400">Este cliente aún no tiene facturas registradas.</p>
            </div>
          ) : (
            clientInvoices.map((inv) => (
              <div key={inv.id} className="bg-surface-800 border border-subtle rounded-xl p-4 hover:border-surface-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Factura #{inv.id.slice(0, 8)}</h4>
                    <p className="text-xs text-muted-400">
                      {format(new Date(inv.created_at), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                    </p>
                  </div>
                  <StatusBadge status={inv.payment_status} />
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-subtle/50 mt-2">
                  <div className="flex items-center gap-1.5 text-muted-400">
                    <Package size={14} />
                    <span className="text-xs">{inv.items?.length || 0} artículos</span>
                  </div>
                  <span className="text-sm font-bold text-white">{format$(inv.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
