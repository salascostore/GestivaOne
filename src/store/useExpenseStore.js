import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'
import { idbStorage } from '@/lib/idbStorage'

const STALE_TIME = 1000 * 60 * 60 * 24 // 24 horas

export const useExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [],
      loading: false,
      lastFetch: 0,

  fetchExpenses: async (force = false) => {
    const { lastFetch } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId) return
    
    const isStale = Date.now() - lastFetch > STALE_TIME
    if (!isStale && !force) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (!error) {
      set({ expenses: data || [], lastFetch: Date.now() })
    } else {
      console.error('❌ Error fetching expenses:', error)
    }
    set({ loading: false })
  },

  addExpense: async (expense) => {
    const { user } = useAuthStore.getState()
    if (!user) return { success: false, error: 'No user authenticated' }

    if (expense.pocketId) {
      const { usePocketStore } = await import('./usePocketStore')
      const success = await usePocketStore.getState().withdrawFunds(expense.pocketId, expense.amount)
      if (!success) {
        return { success: false, error: 'Saldo insuficiente en el bolsillo seleccionado' }
      }
    }

    const newExpense = {
      company_id: user.companyId,
      amount: Number(expense.amount),
      category: expense.category || 'Otros',
      description: expense.description || (expense.pocketId ? `Gasto desde bolsillo` : ''),
      provider_name: expense.provider_name || 'Proveedor Varios',
      provider_doc_id: expense.provider_doc_id || null,
      provider_doc_type: expense.provider_doc_type || '31',
      iva_paid: Number(expense.iva_paid || 0),
      retencion: Number(expense.retencion || 0),
    }

    const { data: saved, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select()
      .single()

    if (error) {
      console.error('❌ Error adding expense:', error)
      import('react-hot-toast').then(m => m.default.error(`Error: ${error.message}`))
      return { success: false, error: error.message }
    }

    set((s) => ({ expenses: [saved, ...s.expenses] }))

    // Notify admin via email asynchronously
    import('../services/emailService').then(({ sendExpenseEmail }) => {
      const { user } = useAuthStore.getState()
      if (user?.email) {
        const company = { companyName: user.companyName || 'GestivaOne', companyLogo: user.companyLogo || null }
        sendExpenseEmail(saved, user.email, company).catch(() => {})
      }
    }).catch(() => {})

    return { success: true, data: saved }
  },

  deleteExpense: async (id) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting expense:', error)
      import('react-hot-toast').then(m => m.default.error(`Error: ${error.message}`))
      return { success: false, error: error.message }
    }

    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
    return { success: true }
  },

  getMonthlyExpenses: () => {
    const { user } = useAuthStore.getState()
    const companyId = user?.companyId
    if (!companyId) return {}
    const months = {}
    get().expenses
      .filter((e) => e.company_id === companyId)
      .forEach((e) => {
        const key = e.created_at.slice(0, 7) // "YYYY-MM"
        months[key] = (months[key] ?? 0) + (e.amount || 0)
      })
    return months
  },

  getTotalExpenses: () => {
    const { user } = useAuthStore.getState()
    const companyId = user?.companyId
    if (!companyId) return 0
    return get().expenses
      .filter((e) => e.company_id === companyId)
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  }
    }),
    {
      name: 'gestiva-expenses-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ expenses: state.expenses, lastFetch: state.lastFetch }),
    }
  )
)
