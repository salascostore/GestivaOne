import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore'

const getCompanyId = () => {
  try {
    const { user } = useAuthStore.getState()
    return user?.companyId || 'demo-company'
  } catch (e) {
    return 'demo-company'
  }
}

export const useExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [
        // Mock data to pre-populate beautifully for the demo
        { id: 'exp-1', company_id: 'demo-company', amount: 180000, category: 'Marketing/Publicidad', description: 'Campaña anuncios Facebook Ads', created_at: '2025-08-25T11:00:00Z' },
        { id: 'exp-2', company_id: 'demo-company', amount: 320000, category: 'Inventario/Mercancía', description: 'Compra de stock inicial granos de café', created_at: '2025-09-10T14:30:00Z' },
        { id: 'exp-3', company_id: 'demo-company', amount: 150000, category: 'Alquiler/Servicios', description: 'Servicio de Internet y Electricidad local', created_at: '2025-10-18T09:00:00Z' },
        { id: 'exp-4', company_id: 'demo-company', amount: 480000, category: 'Salarios/Nómina', description: 'Pago de honorarios soporte', created_at: '2025-11-25T17:00:00Z' },
        { id: 'exp-5', company_id: 'demo-company', amount: 620000, category: 'Inventario/Mercancía', description: 'Importación tazas y accesorios de empaque', created_at: '2025-12-15T15:30:00Z' },
        { id: 'exp-6', company_id: 'demo-company', amount: 220000, category: 'Alquiler/Servicios', description: 'Pago arriendo oficina coworking principal', created_at: '2026-01-10T10:00:00Z' },
        { id: 'exp-7', company_id: 'demo-company', amount: 190000, category: 'Marketing/Publicidad', description: 'Material POP impreso y volantes', created_at: '2026-02-20T11:45:00Z' },
        { id: 'exp-8', company_id: 'demo-company', amount: 350000, category: 'Inventario/Mercancía', description: 'Reabastecimiento inventario té matcha', created_at: '2026-03-15T16:20:00Z' },
        { id: 'exp-9', company_id: 'demo-company', amount: 280000, category: 'Salarios/Nómina', description: 'Nómina soporte técnico del mes', created_at: '2026-04-20T12:00:00Z' },
        { id: 'exp-10', company_id: 'demo-company', amount: 140000, category: 'Otros', description: 'Gastos de papelería y cafetería oficina', created_at: '2026-05-10T14:30:00Z' }
      ],

      addExpense: (expense) => {
        const companyId = getCompanyId()
        const newExpense = {
          id: `EXP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          company_id: companyId,
          amount: Number(expense.amount),
          category: expense.category || 'Otros',
          description: expense.description || '',
          created_at: new Date().toISOString(),
        }
        set((s) => ({ expenses: [newExpense, ...s.expenses] }))
        return { success: true }
      },

      deleteExpense: (id) => {
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
        return { success: true }
      },

      getMonthlyExpenses: () => {
        const companyId = getCompanyId()
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
        const companyId = getCompanyId()
        return get().expenses
          .filter((e) => e.company_id === companyId)
          .reduce((sum, e) => sum + (e.amount || 0), 0)
      }
    }),
    {
      name: 'gestiva-expenses'
    }
  )
)
