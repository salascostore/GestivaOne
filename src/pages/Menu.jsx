import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, Edit2, Trash2, Check, ShoppingBag, History, CalendarDays, MousePointerClick } from 'lucide-react'
import Button from '@/components/ui/Button'
import ScrollIndicator from '@/components/ui/ScrollIndicator'
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

const DOC_TYPES = {
  '13': 'CC',
  '31': 'NIT',
  '22': 'CE',
  '41': 'PAS'
}
const getDocTypeStr = (code) => DOC_TYPES[String(code)] || ''

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 25 } }
}

const smoothTransition = { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.35 }


function ClientCard({ client, selected, onSelect, onEdit, onDelete, onOpenHistory, format$, lastInvoice, pendingAmount, totalBilled, status }) {
  const { baseCurrency, rates } = useCurrencyStore()
  
  const clientCurrency = client.currency
  const showCurrencyRate = clientCurrency && clientCurrency !== baseCurrency && rates[clientCurrency]
  const rateValue = showCurrencyRate ? (rates[baseCurrency] / rates[clientCurrency]).toFixed(2) : null

  const initial = (client.name || '?')[0].toUpperCase()
  const docLabel = client.document_type
    ? `${getDocTypeStr(client.document_type)}${client.document_id ? ` ${client.document_id}` : ''}`
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onSelect}
      className={clsx(
        'relative flex flex-col gap-0 rounded-2xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden bg-white dark:bg-surface-800',
        selected
          ? 'border-brand-500 ring-1 ring-brand-500/30'
          : 'border-neutral-200 dark:border-surface-700 hover:border-brand-500'
      )}
      transition={smoothTransition}
    >
      {/* Top Section: Avatar + Name + Status */}
      <div className={clsx(
        'flex items-center gap-3.5 px-4 pt-4 pb-3 transition-colors duration-300',
        selected ? 'bg-brand-500/10 dark:bg-brand-600/10' : 'bg-transparent'
      )}>
        {/* Avatar with gradient ring */}
        <div className={clsx(
          'relative w-11 h-11 rounded-xl flex items-center justify-center text-base font-extrabold shrink-0 transition-all duration-300 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-800',
          selected
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white ring-brand-500/50'
            : 'bg-neutral-100 dark:bg-surface-600 text-neutral-600 dark:text-foreground ring-transparent group-hover:ring-brand-500/30 group-hover:bg-brand-600/20 group-hover:text-brand-300'
        )}>
          {initial}
          {selected && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 border-2 border-surface-800 dark:border-surface-700 flex items-center justify-center">
              <Check size={8} className="text-white stroke-[3]" />
            </span>
          )}
        </div>

        {/* Name + Doc ID */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate leading-tight">{client.name}</p>
          {docLabel && (
            <p className="text-[11px] font-semibold text-brand-400/80 mt-0.5 uppercase tracking-wide">{docLabel}</p>
          )}
        </div>

        {/* Status Badge */}
        <Badge status={status} />
      </div>

      {/* Middle Section: Info Grid */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-neutral-100 dark:border-surface-700/60 bg-transparent">
        {/* Last Invoice Date */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-500">Última Factura</span>
          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
            <CalendarDays size={11} className="text-muted-500 shrink-0" />
            {lastInvoice
              ? format(new Date(lastInvoice.created_at), "dd MMM yyyy", { locale: es })
              : '—'
            }
          </span>
        </div>

        {/* Total Billed */}
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-500">Total Generado</span>
          <span className="text-xs font-extrabold text-brand-400">{format$(totalBilled)}</span>
        </div>

        {/* Pending (conditional) */}
        {pendingAmount > 0 && (
          <div className="col-span-2">
            <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400">{format$(pendingAmount)} pendiente</span>
          </div>
        )}

        {/* Currency rate (conditional) */}
        {showCurrencyRate && (
          <div className="col-span-2">
            <span className="text-[11px] font-bold text-brand-500/80 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/15 inline-flex items-center gap-1">
              1 {clientCurrency} = {rateValue} {baseCurrency}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Section: Action Buttons */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-100 dark:border-surface-700/60 bg-transparent">
        <div className="flex items-center gap-1.5">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onOpenHistory() }}
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-600/15 hover:bg-brand-600 text-brand-400 hover:text-white transition-all duration-200 cursor-pointer"
            title="Ver Historial"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <History size={13} />
          </motion.button>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-surface-700/60 hover:bg-surface-600 text-muted-400 hover:text-foreground transition-all duration-200 cursor-pointer"
            title="Editar cliente"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit2 size={13} />
          </motion.button>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-transparent text-muted-400 hover:bg-danger-100 hover:text-danger-700 dark:hover:bg-danger-500/20 dark:hover:text-danger-400 transition-all duration-200 cursor-pointer"
            title="Eliminar cliente"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 size={13} />
          </motion.button>
        </div>

        {/* Quick select hint */}
        <div className="flex items-center gap-1 select-none">
          {selected ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-400 flex items-center gap-1">
              <Check size={11} className="stroke-[3]" />
              Elegido
            </span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-400/70 group-hover:text-brand-400 transition-colors flex items-center gap-1">
              <MousePointerClick size={11} className="shrink-0" />
              Haz click para elegir
            </span>
          )}
        </div>
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
        (c.document_id || '').includes(q) ||
        getDocTypeStr(c.document_type).toLowerCase().includes(q)
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
      // Sort by document_id or id if possible
      list.sort((a, b) => {
        const idA = a.document_id || a.id || ''
        const idB = b.document_id || b.id || ''
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
            <h1 className="text-lg md:text-xl font-bold text-foreground">Menú Operativo</h1>
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
      {showExpressModal && typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
        </AnimatePresence>,
        document.body
      ) : null}
      <ScrollIndicator targetSelector=".app-layout main > div" />
    </motion.div>
  )
}
