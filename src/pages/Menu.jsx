import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, Edit2, Trash2, Check, ShoppingBag, History, CalendarDays } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SearchBar from '@/components/ui/SearchBar'
import SortFilterBar from '@/components/ui/SortFilterBar'
import { useClientStore } from '@/store/useClientStore'
import { useUIStore } from '@/store/useUIStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 25 } }
}

const smoothTransition = { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.35 }

function ExpandableButton({ icon: Icon, label, value, onClick, isPurple = true }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={clsx(
        "h-10 rounded-full flex items-center justify-start gap-2 border cursor-pointer select-none shrink-0 shadow-sm overflow-hidden",
        isPurple
          ? "bg-brand-600 hover:bg-brand-500 text-white border-brand-500/40 hover:shadow-glow-sm"
          : "bg-surface-700 hover:bg-surface-600 text-muted-400 hover:text-foreground border-subtle",
        hovered ? "w-[170px] px-3.5" : "w-10 px-2.5 justify-center"
      )}
      transition={smoothTransition}
    >
      <Icon size={15} className="shrink-0" />
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-start leading-none text-left shrink-0 whitespace-nowrap"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</span>
            {value && <span className="text-xs font-black mt-0.5">{value}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function ClientCard({ client, selected, onSelect, onEdit, onDelete, onOpenHistory, format$, lastInvoice, pendingAmount, totalBilled, status }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.005 }}
      onClick={onSelect}
      className={clsx(
        'relative flex flex-col sm:flex-row sm:items-center gap-3.5 p-4 rounded-3xl border-2 cursor-pointer transition-colors duration-300 group',
        selected
          ? 'border-brand-500 bg-brand-600/10 shadow-glow-sm'
          : 'border-subtle bg-surface-800 hover:border-brand-500/30 hover:bg-surface-800/80'
      )}
      transition={smoothTransition}
    >
      <motion.div layout className="flex items-center gap-3 flex-1 min-w-0" transition={smoothTransition}>
        {/* Avatar */}
        <motion.div layout className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 transition-colors duration-300',
          selected ? 'bg-brand-600/40 text-brand-600 dark:text-brand-200' : 'bg-surface-600 text-foreground group-hover:bg-brand-600/20 group-hover:text-brand-600 dark:group-hover:text-brand-300'
        )} transition={smoothTransition}>
          {client.name[0].toUpperCase()}
        </motion.div>

        {/* Info */}
        <motion.div layout className="flex-1 min-w-0 pr-2" transition={smoothTransition}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
            {selected && <Check size={12} className="text-brand-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge status={status} />
            {pendingAmount > 0 && (
              <span className="text-sm text-danger-400 font-semibold">{format$(pendingAmount)} pendiente</span>
            )}
          </div>
          {lastInvoice && (
            <div className="mt-1.5 flex flex-col gap-0.5">
              <p className="text-[13px] text-muted-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500/60 font-semibold"></span>
                Última factura realizada:
              </p>
              <p className="text-sm font-bold text-foreground pl-2.5">
                {format(new Date(lastInvoice.created_at), "dd/MM/yyyy")}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Responsive Visual Indicators & Interactive Expandable Buttons */}
      <motion.div layout className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-brand-500/20 pt-3 sm:pt-0 sm:pl-3 h-auto sm:h-10" transition={smoothTransition}>
        <ExpandableButton
          icon={History}
          label="Total Facturado"
          value={format$(totalBilled)}
          onClick={onOpenHistory}
          isPurple={true}
        />
        <motion.button
          layout
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="h-10 w-10 rounded-full flex items-center justify-center border border-subtle bg-surface-700 hover:bg-surface-600 text-muted-400 hover:text-foreground transition-colors duration-300 shrink-0 cursor-pointer shadow-sm"
          title="Editar cliente"
          transition={smoothTransition}
        >
          <Edit2 size={14} />
        </motion.button>
        <motion.button
          layout
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="h-10 w-10 rounded-full flex items-center justify-center border border-danger-500/10 bg-danger-500/5 hover:bg-danger-500/20 text-danger-400 transition-colors duration-300 shrink-0 cursor-pointer shadow-sm hover:shadow-glow-sm"
          title="Eliminar cliente"
          transition={smoothTransition}
        >
          <Trash2 size={14} />
        </motion.button>
      </motion.div>
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

  // Express Client state
  const [showExpressModal, setShowExpressModal] = useState(false)
  const [expressName, setExpressName] = useState('')
  const [expressDocId, setExpressDocId] = useState('')
  const [expressPhone, setExpressPhone] = useState('')
  const [expressEmail, setExpressEmail] = useState('')
  const [creatingExpress, setCreatingExpress] = useState(false)

  // Sort & Filter state
  const [sortMode, setSortMode] = useState('recent')
  const [activeLetter, setActiveLetter] = useState(null)

  const frequent = getFrequent()

  useEffect(() => {
    useClientStore.getState().fetchClients()
  }, [])

  const letters = useMemo(() => {
    const unique = new Set(frequent.map(c => (c.name || '').charAt(0).toUpperCase()))
    return Array.from(unique).filter(c => c && /[A-Z]/.test(c)).sort()
  }, [frequent])

  const filtered = useMemo(() => {
    let list = [...frequent]

    // 1. Search filter
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.doc_id || '').includes(q)
      )
    }

    // 2. Letter filter
    if (sortMode === 'letter' && activeLetter) {
      list = list.filter((c) => (c.name || '').charAt(0).toUpperCase() === activeLetter)
    }

    // 3. Sorting
    if (sortMode === 'recent') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    } else if (sortMode === 'id') {
      // Sort by doc_id or id if possible
      list.sort((a, b) => {
        const idA = a.doc_id || a.id || ''
        const idB = b.doc_id || b.id || ''
        return idA.toString().localeCompare(idB.toString(), undefined, { numeric: true })
      })
    } else if (sortMode === 'letter') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return list
  }, [frequent, search, sortMode, activeLetter])

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
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container flex flex-col gap-5 h-full">
      {/* Sticky Header & Control Panel */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col gap-4">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Menú Operativo</h1>
            <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Selecciona o añade un cliente para iniciar</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              pill
              icon={<UserPlus size={15} />}
              onClick={() => openModal('addClient')}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shrink-0"
            >
              <span className="hidden sm:inline">Añadir Cliente</span>
              <span className="inline sm:hidden">Nuevo</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              pill
              icon={<ShoppingBag size={15} />}
              onClick={() => setShowExpressModal(true)}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shrink-0"
            >
              <span className="hidden sm:inline">Cliente Express</span>
              <span className="inline sm:hidden">Express</span>
            </Button>
          </div>
        </div>

        {/* Search Bar & Filters inside sticky panel */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar cliente por nombre, correo, teléfono o ID..."
            />
          </div>
          
          <SortFilterBar 
            sortMode={sortMode} 
            onSortChange={setSortMode} 
            activeLetter={activeLetter} 
            onLetterChange={setActiveLetter} 
            letters={letters} 
          />
        </div>
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

      {/* Express Client Modal */}
      <AnimatePresence>
        {showExpressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExpressModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface-800 border border-subtle w-full max-w-md p-6 rounded-3xl shadow-modal z-10 space-y-4 font-sans"
            >
              <div>
                <h3 className="text-base font-bold text-foreground">Factura Express</h3>
                <p className="text-xs text-muted-400 mt-1">
                  Ingresa los detalles de facturación para la venta express.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs text-muted-400 mb-1 block">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    required
                    value={expressName}
                    onChange={(e) => setExpressName(e.target.value)}
                    placeholder="Ej: Juan Pérez o Distribuidora SAS"
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-400 mb-1 block">Cédula / NIT / Código</label>
                  <input
                    type="text"
                    value={expressDocId}
                    onChange={(e) => setExpressDocId(e.target.value)}
                    placeholder="Ej: 1020304050 o 900.123.456-7"
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-400 mb-1 block">Teléfono / Número</label>
                  <input
                    type="tel"
                    value={expressPhone}
                    onChange={(e) => setExpressPhone(e.target.value)}
                    placeholder="Ej: 3001234567"
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-400 mb-1 block">Correo electrónico</label>
                  <input
                    type="email"
                    value={expressEmail}
                    onChange={(e) => setExpressEmail(e.target.value)}
                    placeholder="Ej: cliente@correo.com"
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowExpressModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 font-bold"
                  loading={creatingExpress}
                  onClick={async () => {
                    if (!expressName.trim()) {
                      toast.error('El nombre/razón social es obligatorio')
                      return
                    }
                    setCreatingExpress(true)
                    try {
                      const newCli = await useClientStore.getState().addClient({
                        name: expressName.trim(),
                        document_id: expressDocId.trim() || null,
                        phone: expressPhone.trim() || '',
                        email: expressEmail.trim() || '',
                        type: 'express'
                      })
                      if (newCli) {
                        selectClient(newCli.id)
                        toast.success(`Cliente Express ${newCli.name} seleccionado`, { id: 'client-sel' })
                        setShowExpressModal(false)
                        setExpressName('')
                        setExpressDocId('')
                        setExpressPhone('')
                        setExpressEmail('')
                        navigate('/products')
                      }
                    } catch (e) {
                      toast.error('Error al registrar cliente express')
                    } finally {
                      setCreatingExpress(false)
                    }
                  }}
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
