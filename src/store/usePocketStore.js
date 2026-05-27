import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'
import toast from 'react-hot-toast'

export const usePocketStore = create((set, get) => ({
  pockets: [],

  fetchPockets: () => {
    const auth = useAuthStore.getState()
    const dbPockets = auth.user?.settings?.pockets || []
    set({ pockets: dbPockets })
  },

  savePocketsToDB: async (updatedPockets) => {
    const auth = useAuthStore.getState()
    if (auth.isAuthenticated && auth.user?.companyId) {
      const currentSettings = auth.user.settings || {}
      const updatedSettings = {
        ...currentSettings,
        pockets: updatedPockets
      }
      await auth.updateProfile({ settings: updatedSettings })
      set({ pockets: updatedPockets })
    }
  },

  addPocket: async (pocket) => {
    const newPocket = {
      id: `pocket-${Date.now()}`,
      name: pocket.name || 'Bolsillo nuevo',
      target: Number(pocket.target || 0),
      type: pocket.type || 'caja', // 'caja' | 'tarjeta' | 'factura'
      percentage: Number(pocket.percentage || 0),
      balance: Number(pocket.balance || 0),
      created_at: new Date().toISOString()
    }
    
    // Validate percentage sum
    const current = get().pockets
    const currentPercentageSum = current.reduce((sum, p) => sum + p.percentage, 0)
    if (currentPercentageSum + newPocket.percentage > 100) {
      toast.error('El porcentaje acumulado de todos los bolsillos no puede superar el 100%')
      return false
    }

    const updated = [...current, newPocket]
    await get().savePocketsToDB(updated)
    return true
  },

  updatePocket: async (id, data) => {
    const current = get().pockets
    
    if (data.percentage !== undefined) {
      const otherPercentageSum = current.filter(p => p.id !== id).reduce((sum, p) => sum + p.percentage, 0)
      if (otherPercentageSum + Number(data.percentage) > 100) {
        toast.error('El porcentaje acumulado de todos los bolsillos no puede superar el 100%')
        return false
      }
    }

    const updated = current.map(p => p.id === id ? { ...p, ...data, target: data.target !== undefined ? Number(data.target) : p.target, percentage: data.percentage !== undefined ? Number(data.percentage) : p.percentage } : p)
    await get().savePocketsToDB(updated)
    return true
  },

  deletePocket: async (id) => {
    const current = get().pockets
    const updated = current.filter(p => p.id !== id)
    await get().savePocketsToDB(updated)
  },

  addFunds: async (id, amount) => {
    const amt = Number(amount)
    if (isNaN(amt) || amt <= 0) return false
    const current = get().pockets
    const updated = current.map(p => p.id === id ? { ...p, balance: p.balance + amt } : p)
    await get().savePocketsToDB(updated)
    return true
  },

  withdrawFunds: async (id, amount) => {
    const amt = Number(amount)
    if (isNaN(amt) || amt <= 0) return false
    const current = get().pockets
    const pocket = current.find(p => p.id === id)
    if (!pocket || pocket.balance < amt) {
      toast.error('Fondos insuficientes en el bolsillo')
      return false
    }
    const updated = current.map(p => p.id === id ? { ...p, balance: p.balance - amt } : p)
    await get().savePocketsToDB(updated)
    return true
  },

  // Automatically distribute pocket percentages when invoice is paid
  distributeInvoicePayment: async (invoiceAmount) => {
    const current = get().pockets
    if (current.length === 0) return
    
    let updated = [...current]
    let totalAllocated = 0
    
    updated = updated.map(p => {
      if (p.percentage > 0) {
        const allocated = invoiceAmount * (p.percentage / 100)
        totalAllocated += allocated
        return { ...p, balance: p.balance + allocated }
      }
      return p
    })
    
    if (totalAllocated > 0) {
      await get().savePocketsToDB(updated)
      toast.success(`Distribución automática: se enviaron ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalAllocated)} a tus bolsillos`)
    }
  }
}))
