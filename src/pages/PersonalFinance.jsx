import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Coins, ArrowUpRight, ArrowDownRight, Trash2, Wallet, FileText, CalendarDays } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const PERSONAL_CATEGORIES = ['Alimentación', 'Transporte', 'Entretenimiento', 'Suscripciones', 'Salud/Bienestar', 'Educación', 'Otros']

export default function PersonalFinance() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const format = useCurrencyStore((s) => s.format)

  const [balance, setBalance] = useState(0)
  const [expenses, setExpenses] = useState([])
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  
  // Form fields
  const [addAmount, setAddAmount] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Alimentación')
  const [expDesc, setExpDesc] = useState('')

  // Unique settings key for user's personal finance data
  const storageKey = user ? `personal_finance_${user.id}` : 'personal_finance_local'

  useEffect(() => {
    if (user) {
      const data = user.settings?.[storageKey] || { balance: 0, expenses: [] }
      setBalance(data.balance || 0)
      setExpenses(data.expenses || [])
    } else {
      const local = localStorage.getItem(storageKey)
      if (local) {
        try {
          const parsed = JSON.parse(local)
          setBalance(parsed.balance || 0)
          setExpenses(parsed.expenses || [])
        } catch (e) {}
      }
    }
  }, [user, storageKey])

  const saveData = async (newBalance, newExpenses) => {
    setBalance(newBalance)
    setExpenses(newExpenses)

    if (user) {
      const currentSettings = user.settings || {}
      const updatedSettings = {
        ...currentSettings,
        [storageKey]: {
          balance: newBalance,
          expenses: newExpenses
        }
      }
      await updateProfile({ settings: updatedSettings })
    } else {
      localStorage.setItem(storageKey, JSON.stringify({ balance: newBalance, expenses: newExpenses }))
    }
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    const amt = Number(addAmount)
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido')

    const newBalance = balance + amt
    await saveData(newBalance, expenses)
    toast.success('Dinero ingresado a tu bolsillo personal')
    setAddAmount('')
    setShowAddModal(false)
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    const amt = Number(expAmount)
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido')
    if (balance < amt) return toast.error('No tienes fondos suficientes en tu bolsillo personal')

    const newExpense = {
      id: `pexp-${Date.now()}`,
      amount: amt,
      category: expCategory,
      description: expDesc.trim() || 'Gasto Personal',
      created_at: new Date().toISOString()
    }

    const newBalance = balance - amt
    const newExpenses = [newExpense, ...expenses]

    await saveData(newBalance, newExpenses)
    toast.success('Egreso personal registrado')
    setExpAmount('')
    setExpDesc('')
    setExpCategory('Alimentación')
    setShowExpenseModal(false)
  }

  const handleDeleteExpense = async (id) => {
    const expense = expenses.find(e => e.id === id)
    if (!expense) return

    const newBalance = balance + expense.amount
    const newExpenses = expenses.filter(e => e.id !== id)

    await saveData(newBalance, newExpenses)
    toast.success('Transacción eliminada. Dinero devuelto al bolsillo.')
  }

  return (
    <div className="page-container flex flex-col gap-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Mi Gestión Personal</h1>
          <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Control privado de tus ingresos y egresos personales</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            pill
            icon={<ArrowUpRight size={14} />}
            onClick={() => setShowAddModal(true)}
          >
            Ingresar Dinero
          </Button>
          <Button
            variant="primary"
            size="sm"
            pill
            icon={<Plus size={14} />}
            onClick={() => setShowExpenseModal(true)}
          >
            Registrar Egreso
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Display */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#1b0d3d] to-[#0c051b] border border-brand-500/25 rounded-3xl p-6 flex flex-col justify-between min-h-[200px] shadow-[0_4px_24px_rgba(139,92,246,0.15)] relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-[60px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-brand-400 animate-pulse" />
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Bolsillo Personal</span>
            </div>
            <h2 className="text-[11px] text-muted-400 uppercase tracking-wider font-bold mt-4">Fondos Disponibles</h2>
            <p className="text-3xl font-black text-white mt-1.5 drop-shadow-[0_0_12px_rgba(139,92,246,0.2)]">{format(balance)}</p>
          </div>

          <div className="flex gap-2 mt-6 relative z-10">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight size={13} />
              Agregar Saldo
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-glow-sm"
            >
              <ArrowDownRight size={13} />
              Gastar
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-surface-800 border border-subtle rounded-3xl p-5 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-brand-400" />
              <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400">Mis Egresos Recientes</h3>
            </div>
            <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
              {expenses.length} Transacciones
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-400 py-12">
                <Coins size={36} className="text-muted-500 mb-2" />
                <p className="text-xs">No has registrado gastos personales aún.</p>
                <p className="text-[10px] text-muted-500 mt-1">Usa el botón superior para registrar tu primer gasto privado.</p>
              </div>
            ) : (
              expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-700/20 border border-subtle hover:border-surface-400 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center justify-center text-danger-400 font-bold text-xs shrink-0">
                      $
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{e.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[9px] bg-surface-600 text-muted-300 px-1.5 py-0.2 rounded font-medium">{e.category}</span>
                        <span className="text-[9px] text-muted-500 flex items-center gap-1">
                          <CalendarDays size={10} />
                          {new Date(e.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-danger-400">-{format(e.amount)}</span>
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-1 rounded text-muted-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                      title="Eliminar egreso"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ADD SALDO MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-sm p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Ingresar Saldo</h2>
                <p className="text-xs text-muted-400 mt-0.5">Añade capital a tu bolsillo personal</p>
              </div>

              <form onSubmit={handleAddFunds} className="space-y-4">
                <Input 
                  label="Monto a ingresar ($) *" 
                  value={addAmount} 
                  onChange={setAddAmount} 
                  placeholder="Ej: 100000" 
                  type="number" 
                  required 
                  autoFocus
                />

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1">Confirmar Ingreso</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER EXPENSE MODAL */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExpenseModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-sm p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Registrar Egreso Personal</h2>
                <p className="text-xs text-muted-400 mt-0.5">Ingresa los detalles del gasto privado</p>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <Input 
                  label="Monto del gasto ($) *" 
                  value={expAmount} 
                  onChange={setExpAmount} 
                  placeholder="Ej: 20000" 
                  type="number" 
                  required 
                  autoFocus
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Categoría *</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                  >
                    {PERSONAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <Input 
                  label="Descripción / Concepto *" 
                  value={expDesc} 
                  onChange={setExpDesc} 
                  placeholder="Ej: Almuerzo ejecutivo" 
                  required 
                />

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1">Registrar Egreso</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
