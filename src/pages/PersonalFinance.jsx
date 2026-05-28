import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Coins, ArrowUpRight, ArrowDownRight, Trash2, Wallet, FileText, CalendarDays, Check, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useExpenseStore } from '@/store/useExpenseStore'
import { usePocketStore } from '@/store/usePocketStore'

const PERSONAL_CATEGORIES = ['Alimentación', 'Transporte', 'Entretenimiento', 'Suscripciones', 'Salud/Bienestar', 'Educación', 'Otros']

export default function PersonalFinance() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const format = useCurrencyStore((s) => s.format)

  const invoices = useInvoiceStore((s) => s.invoices)
  const fetchInvoices = useInvoiceStore((s) => s.fetchInvoices)
  const createInvoice = useInvoiceStore((s) => s.createInvoice)

  const expensesList = useExpenseStore((s) => s.expenses)
  const fetchExpenses = useExpenseStore((s) => s.fetchExpenses)
  const addExpense = useExpenseStore((s) => s.addExpense)

  const pockets = usePocketStore((s) => s.pockets)
  const fetchPockets = usePocketStore((s) => s.fetchPockets)
  const addFunds = usePocketStore((s) => s.addFunds)
  const withdrawFunds = usePocketStore((s) => s.withdrawFunds)

  const [balance, setBalance] = useState(0)
  const [expenses, setExpenses] = useState([])
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('expenses') // 'expenses' | 'loans'

  // Loans state
  const [loans, setLoans] = useState([])
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  
  // Form fields (no defaults, only placeholders as requested)
  const [addAmount, setAddAmount] = useState('')
  const [addSource, setAddSource] = useState('manual') // 'manual' | 'utility' | pocketId
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDest, setWithdrawDest] = useState('utility') // 'utility' | pocketId
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Alimentación')
  const [expDesc, setExpDesc] = useState('')
  
  // Loan Form fields (no defaults, only placeholders as requested)
  const [loanContact, setLoanContact] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [loanType, setLoanType] = useState('lent') // 'lent' | 'borrowed'
  const [loanDesc, setLoanDesc] = useState('')
  const [loanDueDate, setLoanDueDate] = useState('')

  const [loading, setLoading] = useState(false)

  // Unique settings key for user's personal finance data
  const storageKey = user ? `personal_finance_${user.id}` : 'personal_finance_local'

  const fetchLoans = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('personal_loans')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setLoans(data || [])
      } catch (e) {
        console.error('Error fetching loans:', e)
      }
    } else {
      const localLoans = localStorage.getItem('personal_loans_local')
      if (localLoans) {
        try {
          setLoans(JSON.parse(localLoans))
        } catch (e) {}
      }
    }
  }

  useEffect(() => {
    if (user) {
      const data = user.settings?.[storageKey] || { balance: 0, expenses: [] }
      setBalance(data.balance || 0)
      setExpenses(data.expenses || [])
      fetchLoans()
      fetchInvoices()
      fetchExpenses()
      fetchPockets()
    } else {
      const local = localStorage.getItem(storageKey)
      if (local) {
        try {
          const parsed = JSON.parse(local)
          setBalance(parsed.balance || 0)
          setExpenses(parsed.expenses || [])
        } catch (e) {}
      }
      const localLoans = localStorage.getItem('personal_loans_local')
      if (localLoans) {
        try {
          setLoans(JSON.parse(localLoans))
        } catch (e) {}
      }
    }
  }, [user, storageKey])

  const utilidadNetaReal = useMemo(() => {
    const totalRev = invoices
      .filter((i) => i.payment_status === 'paid')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0)
    const totalExp = expensesList
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    return totalRev - totalExp
  }, [invoices, expensesList])

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

    setLoading(true)
    try {
      if (addSource === 'utility') {
        if (utilidadNetaReal < amt) {
          toast.error('Fondos insuficientes en la Utilidad Neta del negocio')
          setLoading(false)
          return
        }
        const expResult = await addExpense({
          amount: amt,
          category: 'Retiros',
          description: 'Retiro de utilidad para finanzas personales'
        })
        if (!expResult.success) {
          toast.error(expResult.error || 'Error al retirar fondos de la utilidad neta')
          setLoading(false)
          return
        }
      } else if (addSource !== 'manual') {
        const p = pockets.find(p => p.id === addSource)
        if (!p || p.balance < amt) {
          toast.error('Fondos insuficientes en el bolsillo seleccionado')
          setLoading(false)
          return
        }
        const wResult = await withdrawFunds(addSource, amt)
        if (!wResult) {
          setLoading(false)
          return
        }
      }

      const newBalance = balance + amt
      await saveData(newBalance, expenses)
      toast.success('Dinero ingresado a tu bolsillo personal')
      setAddAmount('')
      setAddSource('manual')
      setShowAddModal(false)
    } catch (err) {
      console.error(err)
      toast.error('Error al ingresar saldo')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawFunds = async (e) => {
    e.preventDefault()
    const amt = Number(withdrawAmount)
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido')
    if (balance < amt) return toast.error('No tienes fondos suficientes en tu bolsillo personal')

    setLoading(true)
    try {
      if (withdrawDest === 'utility') {
        const invResult = await createInvoice({
          client: null,
          items: [{ name: 'Aporte de Capital de Finanzas Personales', qty: 1, price: amt, total: amt }],
          subtotal: amt,
          total: amt,
          paymentType: 'immediate',
          note: JSON.stringify({
            notes: 'Aporte de capital de bolsillo personal',
            payments: [],
            custom_charges: [],
            pocket_id: 'general'
          }),
          pocketId: 'general'
        })
        if (!invResult) {
          toast.error('Error al depositar fondos en la utilidad neta')
          setLoading(false)
          return
        }
      } else {
        const p = pockets.find(p => p.id === withdrawDest)
        if (!p) {
          toast.error('El bolsillo seleccionado no existe')
          setLoading(false)
          return
        }
        const aResult = await addFunds(withdrawDest, amt)
        if (!aResult) {
          setLoading(false)
          return
        }
      }

      const newBalance = balance - amt
      await saveData(newBalance, expenses)
      toast.success('Fondos retirados y transferidos')
      setWithdrawAmount('')
      setWithdrawDest('utility')
      setShowWithdrawModal(false)
    } catch (err) {
      console.error(err)
      toast.error('Error al retirar saldo')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    const amt = Number(expAmount)
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido')
    if (balance < amt) return toast.error('No tienes fondos suficientes en tu bolsillo personal')

    setLoading(true)
    try {
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
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (id) => {
    const expense = expenses.find(e => e.id === id)
    if (!expense) return

    const newBalance = balance + expense.amount
    const newExpenses = expenses.filter(e => e.id !== id)

    await saveData(newBalance, newExpenses)
    toast.success('Transacción eliminada. Dinero devuelto al bolsillo.')
  }

  const handleAddLoan = async (e) => {
    e.preventDefault()
    const amt = Number(loanAmount)
    if (!loanContact.trim()) return toast.error('Ingresa el nombre del contacto')
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido')

    setLoading(true)
    try {
      const newLoanData = {
        contact_name: loanContact.trim(),
        amount: amt,
        type: loanType,
        description: loanDesc.trim() || null,
        due_date: loanDueDate || null,
        status: 'pending'
      }

      if (user) {
        const { data, error } = await supabase
          .from('personal_loans')
          .insert([{ ...newLoanData, user_id: user.id }])
          .select()
        if (error) throw error
        if (data && data[0]) {
          setLoans(prev => [data[0], ...prev])
        }
      } else {
        const localLoan = {
          id: `loan-${Date.now()}`,
          ...newLoanData,
          created_at: new Date().toISOString()
        }
        const updated = [localLoan, ...loans]
        setLoans(updated)
        localStorage.setItem('personal_loans_local', JSON.stringify(updated))
      }

      toast.success('Préstamo registrado')
      setLoanContact('')
      setLoanAmount('')
      setLoanType('lent')
      setLoanDesc('')
      setLoanDueDate('')
      setShowLoanModal(false)
    } catch (err) {
      console.error('Error adding loan:', err)
      toast.error('Error al guardar el préstamo. Revisa si ejecutaste la migración SQL.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLoanStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'paid' : 'pending'
    try {
      if (user) {
        const { error } = await supabase
          .from('personal_loans')
          .update({ status: nextStatus })
          .eq('id', id)
        if (error) throw error
        setLoans(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l))
      } else {
        const updated = loans.map(l => l.id === id ? { ...l, status: nextStatus } : l)
        setLoans(updated)
        localStorage.setItem('personal_loans_local', JSON.stringify(updated))
      }
      toast.success(`Préstamo marcado como ${nextStatus === 'paid' ? 'pagado' : 'pendiente'}`)
    } catch (err) {
      console.error('Error toggling status:', err)
      toast.error('Error al actualizar el préstamo')
    }
  }

  const handleDeleteLoan = async (id) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('personal_loans')
          .delete()
          .eq('id', id)
        if (error) throw error
        setLoans(prev => prev.filter(l => l.id !== id))
      } else {
        const updated = loans.filter(l => l.id !== id)
        setLoans(updated)
        localStorage.setItem('personal_loans_local', JSON.stringify(updated))
      }
      toast.success('Préstamo eliminado')
    } catch (err) {
      console.error('Error deleting loan:', err)
      toast.error('Error al eliminar el préstamo')
    }
  }

  const loansSummary = useMemo(() => {
    return loans.reduce((acc, l) => {
      if (l.status === 'pending') {
        if (l.type === 'lent') {
          acc.toCollect += Number(l.amount || 0)
        } else {
          acc.toPay += Number(l.amount || 0)
        }
      }
      return acc
    }, { toCollect: 0, toPay: 0 })
  }, [loans])

  return (
    <div className="page-container flex flex-col gap-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Mi Gestión Personal</h1>
          <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Control privado de tus ingresos, egresos y préstamos</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'expenses' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                pill
                icon={<ArrowUpRight size={14} />}
                onClick={() => setShowAddModal(true)}
                title="Ingresar saldo desde utilidad del negocio o bolsillos de ahorro"
              >
                Ingresar Dinero
              </Button>
              <Button
                variant="secondary"
                size="sm"
                pill
                icon={<ArrowDownRight size={14} />}
                onClick={() => setShowWithdrawModal(true)}
                title="Retirar saldo y enviarlo a la utilidad del negocio o a un bolsillo"
              >
                Retirar Dinero
              </Button>
              <Button
                variant="primary"
                size="sm"
                pill
                icon={<Plus size={14} />}
                onClick={() => setShowExpenseModal(true)}
                title="Registrar un gasto personal restándolo del bolsillo"
              >
                Registrar Egreso
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              pill
              icon={<Plus size={14} />}
              onClick={() => setShowLoanModal(true)}
              title="Registrar una nueva deuda o un préstamo por cobrar"
            >
              Registrar Préstamo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet & Summary Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Wallet Display */}
          <div className="bg-gradient-to-br from-[#1b0d3d] to-[#0c051b] border border-brand-500/25 rounded-3xl p-6 flex flex-col justify-between min-h-[200px] shadow-[0_4px_24px_rgba(139,92,246,0.15)] relative overflow-hidden">
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

            <div className="flex gap-3 mt-6 relative z-10">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                title="Añadir saldo disponible al bolsillo personal"
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight size={13} />
                Agregar Saldo
              </button>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                title="Retirar saldo del bolsillo personal hacia negocio/bolsillos"
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowDownRight size={13} />
                Retirar Saldo
              </button>
              <button
                type="button"
                onClick={() => setShowExpenseModal(true)}
                title="Gastar dinero restándolo de tus fondos"
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-glow-sm cursor-pointer"
              >
                <Coins size={13} />
                Gastar
              </button>
            </div>
          </div>

          {/* Loans Summary */}
          <div className="bg-surface-800 border border-subtle rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-subtle">
              <Coins size={16} className="text-brand-400" />
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Resumen de Préstamos</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-700/20 border border-subtle rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-success-400 uppercase tracking-widest">Por Cobrar</span>
                  <p className="text-[10px] text-muted-400 mt-0.5">Dinero Prestado</p>
                </div>
                <p className="text-sm font-extrabold text-success-400 mt-2">{format(loansSummary.toCollect)}</p>
              </div>

              <div className="bg-surface-700/20 border border-subtle rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-danger-400 uppercase tracking-widest">Por Pagar</span>
                  <p className="text-[10px] text-muted-400 mt-0.5">Dinero Recibido</p>
                </div>
                <p className="text-sm font-extrabold text-danger-400 mt-2">{format(loansSummary.toPay)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses/Loans List */}
        <div className="lg:col-span-2 bg-surface-800 border border-subtle rounded-3xl p-5 flex flex-col h-[520px]">
          {/* Tabs Selector Header */}
          <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4 shrink-0">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                title="Ver el historial de egresos y gastos personales registrados"
                className={clsx(
                  "pb-3 -mb-[13px] text-xs font-bold uppercase tracking-wider transition-all relative border-b-2 cursor-pointer",
                  activeTab === 'expenses' ? "text-brand-400 border-brand-500" : "text-muted-400 border-transparent hover:text-foreground"
                )}
              >
                Mis Egresos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('loans')}
                title="Ver la lista de préstamos otorgados y deudas pendientes"
                className={clsx(
                  "pb-3 -mb-[13px] text-xs font-bold uppercase tracking-wider transition-all relative border-b-2 cursor-pointer",
                  activeTab === 'loans' ? "text-brand-400 border-brand-500" : "text-muted-400 border-transparent hover:text-foreground"
                )}
              >
                Préstamos y Deudas
              </button>
            </div>
            {activeTab === 'expenses' ? (
              <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                {expenses.length} Transacciones
              </span>
            ) : (
              <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                {loans.length} Registros
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
            {activeTab === 'expenses' ? (
              /* EXPENSES LIST */
              expenses.length === 0 ? (
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
                        title="Eliminar este registro de gasto de forma permanente"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* LOANS LIST */
              loans.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-400 py-12">
                  <Coins size={36} className="text-muted-500 mb-2" />
                  <p className="text-xs">No has registrado préstamos aún.</p>
                  <p className="text-[10px] text-muted-500 mt-1">Usa el botón superior para registrar tu primera cuenta por cobrar o por pagar.</p>
                </div>
              ) : (
                loans.map((l) => {
                  const isLent = l.type === 'lent'
                  const isPaid = l.status === 'paid'
                  const isOverdue = l.due_date && new Date(l.due_date) < new Date() && !isPaid

                  return (
                    <div 
                      key={l.id} 
                      className={clsx(
                        "flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300",
                        isPaid 
                          ? "bg-surface-700/5 border-subtle/30 opacity-75" 
                          : "bg-surface-700/20 border-subtle hover:border-surface-400"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Type Icon indicator */}
                        <div 
                          className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border",
                            isPaid
                              ? "bg-surface-700/30 border-subtle text-muted-400"
                              : isLent 
                              ? "bg-success-500/10 border-success-500/20 text-success-400" 
                              : "bg-danger-500/10 border-danger-500/20 text-danger-400"
                          )}
                        >
                          {isLent ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={clsx("text-xs font-bold truncate max-w-[150px]", isPaid ? "text-muted-400 line-through" : "text-foreground")}>
                              {l.contact_name}
                            </p>
                            <span 
                              className={clsx(
                                "text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider",
                                isPaid 
                                  ? "bg-surface-700 text-muted-400" 
                                  : isLent 
                                  ? "bg-success-500/10 text-success-400" 
                                  : "bg-danger-500/10 text-danger-400"
                              )}
                            >
                              {isLent ? 'Por Cobrar' : 'Por Pagar'}
                            </span>
                          </div>
                          
                          {l.description && (
                            <p className="text-[10.5px] text-muted-400 truncate mt-0.5 max-w-[250px]">{l.description}</p>
                          )}

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[9px] text-muted-500 flex items-center gap-1">
                              <CalendarDays size={10} />
                              {new Date(l.created_at || Date.now()).toLocaleDateString('es-CO')}
                            </span>

                            {l.due_date && (
                              <span 
                                className={clsx(
                                  "text-[9px] flex items-center gap-1 font-semibold",
                                  isPaid 
                                    ? "text-muted-500" 
                                    : isOverdue 
                                    ? "text-danger-400 animate-pulse font-bold" 
                                    : "text-muted-400"
                                )}
                              >
                                <Calendar size={10} />
                                Vence: {new Date(l.due_date).toLocaleDateString('es-CO')} {isOverdue && '(Vencido)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span 
                          className={clsx(
                            "text-xs font-extrabold",
                            isPaid
                              ? "text-muted-500 line-through"
                              : isLent 
                              ? "text-success-400" 
                              : "text-danger-400"
                          )}
                        >
                          {isLent ? '+' : '-'}{format(l.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Toggle Paid Action */}
                          <button
                            onClick={() => handleToggleLoanStatus(l.id, l.status)}
                            className={clsx(
                              "p-1.5 rounded transition-colors border cursor-pointer",
                              isPaid 
                                ? "bg-success-500/15 border-success-500/30 text-success-400 hover:bg-success-500/25" 
                                : "bg-surface-700 border-subtle text-muted-400 hover:text-success-400 hover:border-success-500/30"
                            )}
                            title={isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
                          >
                            <Check size={11} />
                          </button>

                          {/* Delete Action */}
                          <button
                            onClick={() => handleDeleteLoan(l.id)}
                            className="p-1.5 rounded border border-transparent text-muted-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors cursor-pointer"
                            title="Eliminar este préstamo/deuda permanentemente"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )
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
                  onChange={e => setAddAmount(e.target.value)} 
                  placeholder="Ej: 100000" 
                  type="number" 
                  required 
                  autoFocus
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Procedencia de los Fondos *</label>
                  <select
                    value={addSource}
                    onChange={e => setAddSource(e.target.value)}
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                  >
                    <option value="manual">Ingreso Manual (Sin origen/Efectivo)</option>
                    <option value="utility">Utilidad Neta (Negocio) - Disp: {format(utilidadNetaReal)}</option>
                    {pockets.map(p => (
                      <option key={p.id} value={p.id}>Bolsillo: {p.name} - Disp: {format(p.balance)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>Confirmar Ingreso</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WITHDRAW SALDO MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWithdrawModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-sm p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Retirar Saldo</h2>
                <p className="text-xs text-muted-400 mt-0.5">Retira capital de tu bolsillo personal y envíalo al negocio o bolsillos de ahorro</p>
              </div>

              <form onSubmit={handleWithdrawFunds} className="space-y-4">
                <Input 
                  label="Monto a retirar ($) *" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  placeholder="Ej: 50000" 
                  type="number" 
                  required 
                  autoFocus
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Destino de los Fondos *</label>
                  <select
                    value={withdrawDest}
                    onChange={e => setWithdrawDest(e.target.value)}
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                  >
                    <option value="utility">Utilidad Neta (Negocio)</option>
                    {pockets.map(p => (
                      <option key={p.id} value={p.id}>Bolsillo: {p.name} (Saldo: {format(p.balance)})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowWithdrawModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>Confirmar Retiro</Button>
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
                  onChange={e => setExpAmount(e.target.value)} 
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
                  onChange={e => setExpDesc(e.target.value)} 
                  placeholder="Ej: Almuerzo ejecutivo" 
                  required 
                />

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>Registrar Egreso</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER LOAN MODAL */}
      <AnimatePresence>
        {showLoanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLoanModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-800 border border-subtle w-full max-w-sm p-6 rounded-3xl shadow-modal z-10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Registrar Préstamo o Deuda</h2>
                <p className="text-xs text-muted-400 mt-0.5">Registra dinero prestado u obtenido</p>
              </div>

              <form onSubmit={handleAddLoan} className="space-y-4">
                <Input 
                  label="Nombre del Contacto *" 
                  value={loanContact} 
                  onChange={e => setLoanContact(e.target.value)} 
                  placeholder="Ej: Juan Pérez" 
                  required 
                  autoFocus
                />

                <Input 
                  label="Monto del préstamo ($) *" 
                  value={loanAmount} 
                  onChange={e => setLoanAmount(e.target.value)} 
                  placeholder="Ej: 150000" 
                  type="number" 
                  required 
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Tipo de Operación *</label>
                  <select
                    value={loanType}
                    onChange={e => setLoanType(e.target.value)}
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                  >
                    <option value="lent">Dinero que presté (Por Cobrar)</option>
                    <option value="borrowed">Dinero que recibí prestado (Por Pagar)</option>
                  </select>
                </div>

                <Input 
                  label="Detalle / Concepto" 
                  value={loanDesc} 
                  onChange={e => setLoanDesc(e.target.value)} 
                  placeholder="Ej: Préstamo para repuestos" 
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Fecha de Vencimiento (Opcional)</label>
                  <input
                    type="date"
                    value={loanDueDate}
                    onChange={e => setLoanDueDate(e.target.value)}
                    className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setShowLoanModal(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={loading}>Registrar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
