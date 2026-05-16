import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, Edit2, Trash2, Check, ShoppingBag } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SearchBar from '@/components/ui/SearchBar'
import { useClientStore } from '@/store/useClientStore'
import { useUIStore } from '@/store/useUIStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function ClientCard({ client, selected, onSelect, onEdit, onDelete, format$, lastInvoice, pendingAmount, status }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1 }}
      onClick={onSelect}
      className={clsx(
        'relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all group',
        selected
          ? 'border-brand-500 bg-brand-600/10'
          : 'border-subtle bg-surface-800 hover:border-surface-300'
      )}
    >
      {/* Avatar */}
      <div className={clsx(
        'w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0',
        selected ? 'bg-brand-600/40 text-brand-200' : 'bg-surface-600 text-white'
      )}>
        {client.name[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{client.name}</p>
          {selected && <Check size={12} className="text-brand-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge status={status} />
          {pendingAmount > 0 && (
            <span className="text-[11px] text-danger-400 font-medium">{format$(pendingAmount)} pendiente</span>
          )}
        </div>
        {lastInvoice && (
          <p className="text-[11px] text-muted-400 mt-1">
            Última factura: {format(new Date(lastInvoice.createdAt), "d MMM yyyy", { locale: es })}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-600"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1.5 rounded-lg text-muted-400 hover:text-danger-400 hover:bg-danger-900/30"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  )
}

export default function Menu() {
  const [search, setSearch]     = useState('')
  const clients       = useClientStore((s) => s.clients)
  const selectedId    = useClientStore((s) => s.selectedClientId)
  const selectClient  = useClientStore((s) => s.selectClient)
  const deleteClient  = useClientStore((s) => s.deleteClient)
  const getFrequent   = useClientStore((s) => s.getFrequent)
  const openModal     = useUIStore((s) => s.openModal)
  const invoices      = useInvoiceStore((s) => s.invoices)
  const format$       = useCurrencyStore((s) => s.format)

  const frequent = getFrequent()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return frequent.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  }, [frequent, search])

  const getClientStatus = (clientId) => {
    const clientInvoices = invoices.filter((i) => i.clientId === clientId)
    if (clientInvoices.some((i) => i.paymentStatus === 'overdue')) return 'overdue'
    if (clientInvoices.some((i) => i.paymentStatus === 'pending')) return 'pending'
    if (clientInvoices.length > 0) return 'paid'
    return 'default'
  }

  const getLastInvoice = (clientId) =>
    invoices.filter((i) => i.clientId === clientId)[0] ?? null

  const getPending = (clientId) =>
    invoices
      .filter((i) => i.clientId === clientId && i.paymentStatus !== 'paid')
      .reduce((s, i) => s + i.total, 0)

  const handleDelete = (client) => {
    deleteClient(client.id)
    toast.success(`${client.name} eliminado`)
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Menú Operativo</h1>
        <p className="text-sm text-muted-400 mt-0.5">Selecciona o añade un cliente para iniciar</p>
      </div>

      {/* Top section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="primary"
            size="lg"
            icon={<UserPlus size={18} />}
            className="w-full justify-center"
            onClick={() => openModal('addClient')}
          >
            Añadir Cliente
          </Button>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="secondary"
            size="lg"
            icon={<ShoppingBag size={18} />}
            className="w-full justify-center"
            onClick={() => {
              // Express client: clear selection and proceed
              selectClient(null)
              toast('Modo express activado — sin cliente asignado', { icon: '⚡' })
            }}
          >
            Cliente Express
          </Button>
        </motion.div>
      </div>

      {/* Frequent clients */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">Clientes Frecuentes</span>
            <span className="text-xs text-muted-400 bg-surface-600 px-2 py-0.5 rounded-full">{frequent.length}</span>
          </div>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar cliente por nombre, correo o teléfono..."
        />

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Users size={32} className="text-muted-400 mx-auto mb-3" />
                <p className="text-sm text-muted-400">
                  {search ? 'Sin resultados para tu búsqueda' : 'Aún no tienes clientes frecuentes'}
                </p>
              </motion.div>
            ) : (
              filtered.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  selected={selectedId === client.id}
                  onSelect={() => selectClient(client.id)}
                  onEdit={() => openModal('addClient', { client })}
                  onDelete={() => handleDelete(client)}
                  format$={format$}
                  lastInvoice={getLastInvoice(client.id)}
                  pendingAmount={getPending(client.id)}
                  status={getClientStatus(client.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
