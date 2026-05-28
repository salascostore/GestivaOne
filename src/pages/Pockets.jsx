import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderPlus, Coins, ArrowUpRight, ArrowDownRight, Trash2, Edit, CreditCard, Box as BoxIcon, Receipt } from 'lucide-react'
import { usePocketStore } from '@/store/usePocketStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const POCKET_TYPES = [
  { id: 'caja', label: 'Caja Fuerte', icon: BoxIcon, desc: 'Ideal para efectivo o reserva general' },
  { id: 'tarjeta', label: 'Tarjeta Prepago', icon: CreditCard, desc: 'Gastos digitales o suscripciones' },
  { id: 'factura', label: 'Factura Fija', icon: Receipt, desc: 'Pagos recurrentes o gastos fijos' },
]

export default function Pockets() {
  const pockets = usePocketStore((s) => s.pockets)
  const fetchPockets = usePocketStore((s) => s.fetchPockets)
  const addPocket = usePocketStore((s) => s.addPocket)
  const updatePocket = usePocketStore((s) => s.updatePocket)
  const deletePocket = usePocketStore((s) => s.deletePocket)
  const addFunds = usePocketStore((s) => s.addFunds)
  const withdrawFunds = usePocketStore((s) => s.withdrawFunds)
  const format = useCurrencyStore((s) => s.format)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(null) // { pocketId, action: 'add' | 'withdraw' }
  const [fundAmount, setFundAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Form state
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [type, setType] = useState('caja')
  const [percentage, setPercentage] = useState('')
  const [balance, setBalance] = useState('')

  // Edit Form state
  const [editPocketId, setEditPocketId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editPercentage, setEditPercentage] = useState('')
  const [editType, setEditType] = useState('caja')

  const handleOpenEdit = (pocket) => {
    setEditPocketId(pocket.id)
    setEditName(pocket.name)
    setEditTarget(pocket.target || '')
    setEditPercentage(pocket.percentage || '')
    setEditType(pocket.type || 'caja')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return toast.error('Ingresa un nombre para el bolsillo')
    
    setLoading(true)
    try {
      const success = await updatePocket(editPocketId, {
        name: editName.trim(),
        target: Number(editTarget) || 0,
        type: editType,
        percentage: Number(editPercentage) || 0,
      })

      if (success) {
        toast.success('Bolsillo actualizado')
        setEditPocketId(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPockets()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Ingresa un nombre para el bolsillo')
    
    setLoading(true)
    try {
      const success = await addPocket({
        name: name.trim(),
        target: Number(target) || 0,
        type,
        percentage: Number(percentage) || 0,
        balance: Number(balance) || 0
      })

      if (success) {
        toast.success('Bolsillo creado exitosamente')
        setName('')
        setTarget('')
        setType('caja')
        setPercentage('')
        setBalance('')
        setShowAddModal(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFundAction = async (e) => {
    e.preventDefault()
    const amt = Number(fundAmount)
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido')

    setLoading(true)
    try {
      let success = false
      if (showFundModal.action === 'add') {
        success = await addFunds(showFundModal.pocketId, amt)
        if (success) toast.success('Fondos agregados')
      } else {
        success = await withdrawFunds(showFundModal.pocketId, amt)
        if (success) toast.success('Fondos retirados')
      }

      if (success) {
        setFundAmount('')
        setShowFundModal(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex flex-col gap-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-row items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Bolsillos de Ahorro</h1>
          <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Distribuye tus fondos y programa gastos fijos</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          pill
          icon={<Plus size={14} />}
          onClick={() => setShowAddModal(true)}
          title="Crear un nuevo bolsillo con meta de ahorro o desvío automático de ventas"
        >
          Crear Bolsillo
        </Button>
      </div>

      {/* Pockets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pockets.length === 0 ? (
          <div className="col-span-full bg-surface-800/40 border border-subtle border-dashed rounded-3xl p-12 text-center text-muted-400 flex flex-col items-center justify-center gap-3">
            <FolderPlus size={36} className="text-muted-500" />
            <div>
              <p className="text-sm font-bold text-foreground">No tienes bolsillos activos</p>
              <p className="text-xs text-muted-500 mt-1 max-w-sm">Crea bolsillos para separar fondos específicos, apartar dinero para impuestos o deducir tus egresos operacionales de forma controlada.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="mt-2" title="Crear un nuevo bolsillo para comenzar a ahorrar">Crear mi primer bolsillo</Button>
          </div>
        ) : (
          pockets.map((p) => {
            const hasTarget = p.target > 0
            const percent = hasTarget ? Math.min(100, (p.balance / p.target) * 100) : 0
            
            return (
              <motion.div
                key={p.id}
                layout
                className={clsx(
                  "relative rounded-3xl p-5 overflow-hidden flex flex-col justify-between min-h-[190px] border transition-all duration-300",
                  p.type === 'tarjeta' 
                    ? "bg-gradient-to-br from-[#1e1145] to-[#120a28] border-brand-500/20 shadow-[0_4px_20px_rgba(124,58,237,0.15)]"
                    : p.type === 'caja'
                    ? "bg-surface-800 border-subtle hover:border-brand-500/30"
                    : "bg-surface-850 border-dashed border-subtle"
                )}
              >
                {/* Visual Accent for Pockets */}
                {p.type === 'tarjeta' && (
                  <div className="absolute top-4 right-4 w-8 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded-md opacity-80 flex items-center justify-center overflow-hidden">
                    <div className="grid grid-cols-3 gap-0.5 w-6 h-4 opacity-50">
                      {[...Array(6)].map((_, idx) => <div key={idx} className="bg-black/30 rounded-xs" />)}
                    </div>
                  </div>
                )}

                {p.type === 'caja' && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full border border-subtle flex items-center justify-center bg-surface-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-400" />
                  </div>
                )}

                {/* Info Header */}
                <div>
                  <div className="flex items-center gap-2">
                    {p.type === 'tarjeta' && <CreditCard size={15} className="text-brand-400" />}
                    {p.type === 'caja' && <BoxIcon size={15} className="text-success-400" />}
                    {p.type === 'factura' && <Receipt size={15} className="text-warning-400" />}
                    <span className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">{p.type === 'caja' ? 'Caja Fuerte' : p.type === 'tarjeta' ? 'Tarjeta' : 'Factura fija'}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1.5 truncate max-w-[180px]">{p.name}</h3>
                  {p.percentage > 0 && (
                    <span className="inline-block text-[9px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full font-bold mt-1.5">
                      Recibe {p.percentage}% de cada venta
                    </span>
                  )}
                </div>

                {/* Balance & Progress */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] text-muted-500 font-bold uppercase tracking-wider">Saldo</p>
                      <p className="text-xl font-black text-foreground mt-0.5">{format(p.balance)}</p>
                    </div>
                    {hasTarget && (
                      <div className="text-right">
                        <p className="text-[9px] text-muted-500 font-medium">Meta: {format(p.target)}</p>
                        <p className="text-[10px] font-extrabold text-brand-400 mt-0.5">{Math.round(percent)}%</p>
                      </div>
                    )}
                  </div>

                  {hasTarget && (
                    <div className="w-full h-1.5 bg-surface-700/60 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-500",
                          percent >= 100 ? "bg-success-500" : "bg-brand-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-subtle/50 pt-3 mt-4">
                  <button
                    onClick={() => setShowFundModal({ pocketId: p.id, action: 'add' })}
                    title="Añadir dinero manualmente a este bolsillo"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 text-xs font-bold transition-all"
                  >
                    <ArrowUpRight size={12} />
                    Depositar
                  </button>
                  <button
                    onClick={() => setShowFundModal({ pocketId: p.id, action: 'withdraw' })}
                    title="Retirar saldo de este bolsillo para moverlo al balance general"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-surface-700 hover:bg-surface-650 text-muted-300 text-xs font-bold transition-all"
                  >
                    <ArrowDownRight size={12} />
                    Retirar
                  </button>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/30 text-brand-400 transition-all shrink-0"
                    title="Editar bolsillo"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="p-1.5 rounded-xl bg-danger-900/10 hover:bg-danger-900/30 text-danger-400 transition-all shrink-0"
                    title="Eliminar este bolsillo permanentemente y retirar su saldo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* CREATE POCKET MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-md p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Crear Nuevo Bolsillo</h2>
                <p className="text-xs text-muted-400 mt-0.5">Asigna metas y transferencias automáticas</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <Input label="Nombre del Bolsillo *" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Pago de Impuestos" required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Meta/Tope Limite (Opcional)" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ej: 1000000" type="number" />
                  <Input label="Saldo Inicial" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" type="number" />
                </div>
                <Input label="Desviar porcentaje de cobros (%)" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="Ej: 10" type="number" min="0" max="100" />
                
                {/* Pocket type selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-500 uppercase tracking-wide">Diseño / Formato</span>
                  <div className="grid grid-cols-3 gap-2">
                    {POCKET_TYPES.map((t) => {
                      const Icon = t.icon
                      const active = type === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id)}
                          className={clsx(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                            active 
                              ? "border-brand-500 bg-brand-600/10 text-brand-400"
                              : "border-subtle bg-surface-700 hover:border-surface-600 text-muted-400"
                          )}
                        >
                          <Icon size={16} />
                          <span className="text-[10px] font-bold">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>Crear Bolsillo</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FUND ACTION MODAL (DEPOSIT / WITHDRAW) */}
      <AnimatePresence>
        {showFundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFundModal(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-sm p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {showFundModal.action === 'add' ? 'Depositar Fondos' : 'Retirar Fondos'}
                </h2>
                <p className="text-xs text-muted-400 mt-0.5">Ingresa el monto de la transacción</p>
              </div>

              <form onSubmit={handleFundAction} className="space-y-4">
                <Input 
                  label="Monto de la transacción ($) *" 
                  value={fundAmount} 
                  onChange={e => setFundAmount(e.target.value)} 
                  placeholder="Ej: 50000" 
                  type="number" 
                  required 
                  autoFocus
                />

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowFundModal(null)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>
                    {showFundModal.action === 'add' ? 'Confirmar Depósito' : 'Confirmar Retiro'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-sm p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">¿Eliminar Bolsillo?</h2>
                <p className="text-xs text-muted-400 mt-1.5 leading-relaxed">
                  Se perderá el saldo acumulado de este bolsillo. Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
                <Button 
                  type="button" 
                  variant="primary" 
                  size="md" 
                  className="flex-1 bg-danger-600 hover:bg-danger-700 text-white border-none shadow-glow-sm" 
                  onClick={async () => {
                    await deletePocket(deleteConfirmId);
                    setDeleteConfirmId(null);
                    toast.success('Bolsillo eliminado');
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT POCKET MODAL */}
      <AnimatePresence>
        {editPocketId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditPocketId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-md p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Editar Bolsillo</h2>
                <p className="text-xs text-muted-400 mt-0.5">Modifica los detalles y límites de tu bolsillo</p>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <Input label="Nombre del Bolsillo *" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ej: Pago de Impuestos" required />
                <Input label="Meta/Tope Limite (Opcional)" value={editTarget} onChange={e => setEditTarget(e.target.value)} placeholder="Ej: 1000000" type="number" />
                <Input label="Desviar porcentaje de cobros (%)" value={editPercentage} onChange={e => setEditPercentage(e.target.value)} placeholder="Ej: 10" type="number" min="0" max="100" />
                
                {/* Pocket type selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-500 uppercase tracking-wide">Diseño / Formato</span>
                  <div className="grid grid-cols-3 gap-2">
                    {POCKET_TYPES.map((t) => {
                      const Icon = t.icon
                      const active = editType === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditType(t.id)}
                          className={clsx(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                            active 
                              ? "border-brand-500 bg-brand-600/10 text-brand-400"
                              : "border-subtle bg-surface-700 hover:border-surface-600 text-muted-400"
                          )}
                        >
                          <Icon size={16} />
                          <span className="text-[10px] font-bold">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setEditPocketId(null)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>Guardar Cambios</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
