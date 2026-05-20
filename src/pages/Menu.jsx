import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, Edit2, Trash2, Check, ShoppingBag, History, CalendarDays } from 'lucide-react'
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

function ExpandableButton({ icon: Icon, label, value, onClick, isPurple = true }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={clsx(
        "h-10 rounded-full flex items-center justify-start gap-2 border transition-all duration-300 ease-out-expo cursor-pointer select-none shrink-0 shadow-sm overflow-hidden",
        isPurple
          ? "bg-brand-600 hover:bg-brand-500 text-white border-brand-500/40 hover:shadow-glow-sm"
          : "bg-surface-700 hover:bg-surface-600 text-muted-400 hover:text-white border-white/5",
        hovered ? "w-[170px] px-3.5" : "w-10 px-2.5 justify-center"
      )}
    >
      <Icon size={15} className="shrink-0" />
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-start leading-none text-left shrink-0"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">{label}</span>
            {value && <span className="text-xs font-black mt-0.5">{value}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

function ClientCard({ client, selected, onSelect, onEdit, onDelete, onOpenHistory, format$, lastInvoice, pendingAmount, totalBilled, status }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.005 }}
      onClick={onSelect}
      className={clsx(
        'relative flex flex-col sm:flex-row sm:items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group',
        selected
          ? 'border-brand-500 bg-brand-600/10 shadow-glow-sm'
          : 'border-subtle bg-surface-800 hover:border-brand-500/30 hover:bg-surface-800/80'
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 transition-all duration-300',
          selected ? 'bg-brand-600/40 text-brand-200' : 'bg-surface-600 text-white group-hover:bg-brand-600/20 group-hover:text-brand-300'
        )}>
          {client.name[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
            {selected && <Check size={12} className="text-brand-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge status={status} />
            {pendingAmount > 0 && (
              <span className="text-[11px] text-danger-400 font-medium">{format$(pendingAmount)} pendiente</span>
            )}
          </div>
          {lastInvoice && (
            <p className="text-[10px] text-muted-400 flex items-center gap-1 mt-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500/60"></span>
              Última factura realizada: {format(new Date(lastInvoice.created_at), "dd/MM/yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Responsive Visual Indicators & Interactive Expandable Buttons */}
      <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-brand-500/20 pt-3 sm:pt-0 sm:pl-3 h-auto sm:h-10">
        <ExpandableButton
          icon={History}
          label="Total Facturado"
          value={format$(totalBilled)}
          onClick={onOpenHistory}
          isPurple={true}
        />
        <ExpandableButton
          icon={Edit2}
          label="Editar Cliente"
          value="Modificar"
          onClick={onEdit}
          isPurple={false}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="h-10 w-10 rounded-full flex items-center justify-center border border-danger-500/10 bg-danger-500/5 hover:bg-danger-500/20 text-danger-400 transition-all duration-300 shrink-0 cursor-pointer shadow-sm hover:shadow-glow-sm"
          title="Eliminar cliente"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}

export default function Menu() {
  const navigate      = useNavigate()
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

  useEffect(() => {
    useClientStore.getState().fetchClients()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return frequent.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  }, [frequent, search])

  const getClientStatus = (clientId) => {
    const clientInvoices = invoices.filter((i) => i.client_id === clientId)
    if (clientInvoices.some((i) => i.payment_status === 'overdue')) return 'overdue'
    if (clientInvoices.some((i) => i.payment_status === 'pending')) return 'pending'
    if (clientInvoices.length > 0) return 'paid'
    return 'default'
  }

  const getLastInvoice = (clientId) =>
    invoices.filter((i) => i.client_id === clientId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0] ?? null

  const getPending = (clientId) =>
    invoices
      .filter((i) => i.client_id === clientId && i.payment_status !== 'paid')
      .reduce((s, i) => {
        let paidAmount = 0
        if (i.note) {
          try {
            if (i.note.trim().startsWith('{') && i.note.trim().endsWith('}')) {
              const parsed = JSON.parse(i.note)
              if (parsed && parsed.payments) {
                paidAmount = parsed.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
              }
            }
          } catch (e) {}
        }
        return s + (i.total - paidAmount)
      }, 0)

  const getTotalBilled = (clientId) =>
    invoices
      .filter((i) => i.client_id === clientId)
      .reduce((s, i) => s + i.total, 0)

  const handleDelete = (client) => {
    deleteClient(client.id)
    toast.success(`${client.name} eliminado`)
  }

  return (
    <div className="page-container flex flex-col gap-5 h-full">
      {/* Sticky Header & Control Panel */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20 flex flex-col gap-4">
        {/* Title and Actions */}
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Menú Operativo</h1>
            <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Selecciona o añade un cliente para iniciar</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus size={15} />}
              onClick={() => openModal('addClient')}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl shrink-0"
            >
              <span className="hidden sm:inline">Añadir Cliente</span>
              <span className="inline sm:hidden">Nuevo</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<ShoppingBag size={15} />}
              onClick={() => {
                selectClient(null)
                toast.success('Cliente Express activado', { id: 'client-sel' })
                navigate('/products')
              }}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl shrink-0"
            >
              <span className="hidden sm:inline">Cliente Express</span>
              <span className="inline sm:hidden">Express</span>
            </Button>
          </div>
        </div>

        {/* Search Bar inside sticky panel */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar cliente por nombre, correo o teléfono..."
        />
      </div>

      {/* Frequent clients */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-brand-400" />
            <span className="text-sm font-semibold text-foreground">Clientes Frecuentes</span>
            <span className="text-xs text-muted-400 bg-surface-600 px-2 py-0.5 rounded-full">{frequent.length}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12"
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
                    onSelect={() => {
                      selectClient(client.id)
                      toast.success(`Cliente ${client.name} seleccionado`, { id: 'client-sel' })
                      navigate('/products')
                    }}
                    onEdit={() => openModal('addClient', { client })}
                    onDelete={() => handleDelete(client)}
                    onOpenHistory={() => openModal('clientHistory', { client })}
                    format$={format$}
                    lastInvoice={getLastInvoice(client.id)}
                    pendingAmount={getPending(client.id)}
                    totalBilled={getTotalBilled(client.id)}
                    status={getClientStatus(client.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
