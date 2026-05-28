import { create } from 'zustand'
import { useCurrencyStore } from './useCurrencyStore'
import { useAuthStore } from './useAuthStore'

const TAX_RATES = {
  COP: 0.19,
  MXN: 0.16,
  USD: 0.0,
  EUR: 0.21,
  ARS: 0.21,
  CLP: 0.19,
  PEN: 0.18,
  CRC: 0.13,
  DOP: 0.18,
}

export const useCartStore = create((set, get) => {
  const recalculate = (state) => {
    const items = state.items ?? get().items
    const includeTax = state.includeTax ?? get().includeTax
    const customCharges = state.customCharges ?? get().customCharges
    
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const baseCurrency = useCurrencyStore.getState().baseCurrency
    const taxRate = TAX_RATES[baseCurrency] ?? 0.0
    const taxAmount = includeTax ? subtotal * taxRate : 0
    const customChargesSum = customCharges
      .filter(c => c.applied)
      .reduce((sum, c) => {
        const val = Number(c.value || 0)
        if (c.type === 'percent') {
          return sum + (subtotal * (val / 100))
        } else {
          return sum + val
        }
      }, 0)
    const total = subtotal + taxAmount + customChargesSum
    
    return { subtotal, taxAmount, customChargesSum, total }
  }

  const setAndRecalc = (updateFnOrObj) => {
    set((state) => {
      const updates = typeof updateFnOrObj === 'function' ? updateFnOrObj(state) : updateFnOrObj
      const nextState = { ...state, ...updates }
      const totals = recalculate(nextState)
      return { ...nextState, ...totals }
    })
  }

  return {
    items: [],   // { id, productId, name, price, qty, unit, isCustom }
    note: '',
    includeTax: false,
    customCharges: [], // { id, name, type: 'percent'|'fixed', value, applied, pinned }
    subtotal: 0,
    taxAmount: 0,
    customChargesSum: 0,
    total: 0,

    toggleTax: () => setAndRecalc((s) => ({ includeTax: !s.includeTax })),

    addItem: (product, qty = 1) => {
      setAndRecalc((s) => {
        const existing = s.items.find((i) => i.productId === product.id)
        if (existing) {
          return {
            items: s.items.map((i) =>
               i.productId === product.id ? { ...i, qty: i.qty + qty } : i
            ),
          }
        }
        return {
          items: [
            ...s.items,
            {
              id: `cart-${Date.now()}-${Math.random()}`,
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              qty,
              unit: product.unit ?? 'UND',
              isCustom: product.isCustom ?? false,
            },
          ],
        }
      })
    },

    addCustomItem: (name, price, description = '') => {
      setAndRecalc((s) => ({
        items: [
          ...s.items,
          {
            id: `custom-${Date.now()}`,
            productId: null,
            name: name || 'Valor libre',
            description,
            price: Number(price),
            qty: 1,
            unit: 'UND',
            isCustom: true,
          },
        ],
      }))
    },

    removeItem: (id) =>
      setAndRecalc((s) => ({ items: s.items.filter((i) => i.id !== id) })),

    updateQty: (id, qty) => {
      if (qty <= 0) { get().removeItem(id); return }
      setAndRecalc((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, qty: Number(qty) } : i)),
      }))
    },

    updatePrice: (id, price) =>
      setAndRecalc((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, price: Number(price) } : i)),
      })),

    setNote: (note) => set({ note }),

    clearCart: () => {
      // Keep pinned custom charges when clearing cart
      const pinned = get().customCharges.filter(c => c.pinned)
      setAndRecalc({ items: [], note: '', includeTax: false, customCharges: pinned.map(c => ({ ...c, applied: true })) })
    },

    addCustomCharge: async (charge) => {
      const newCharge = {
        id: `charge-${Date.now()}`,
        applied: true,
        pinned: false,
        ...charge
      }
      setAndRecalc((s) => ({ customCharges: [...s.customCharges, newCharge] }))
      if (charge.pinned) {
        await get().savePinnedChargesToDB()
      }
    },

    removeCustomCharge: async (id) => {
      const wasPinned = get().customCharges.find(c => c.id === id)?.pinned
      setAndRecalc((s) => ({ customCharges: s.customCharges.filter(c => c.id !== id) }))
      if (wasPinned) {
        await get().savePinnedChargesToDB()
      }
    },

    toggleCustomChargeApplied: (id) => {
      setAndRecalc((s) => ({
        customCharges: s.customCharges.map(c => c.id === id ? { ...c, applied: !c.applied } : c)
      }))
    },

    toggleCustomChargePin: async (id) => {
      let updatedCharges = []
      setAndRecalc((s) => {
        updatedCharges = s.customCharges.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)
        return { customCharges: updatedCharges }
      })
      await get().savePinnedChargesToDB()
    },

    loadPinnedCharges: () => {
      const auth = useAuthStore.getState()
      const pinned = auth.user?.settings?.pinned_charges || []
      setAndRecalc({
        customCharges: pinned.map(c => ({ ...c, applied: true, id: c.id || `charge-${Math.random()}` }))
      })
    },

    savePinnedChargesToDB: async () => {
      const auth = useAuthStore.getState()
      if (auth.isAuthenticated && auth.user?.companyId) {
        const currentSettings = auth.user.settings || {}
        const pinned = get().customCharges.filter(c => c.pinned).map(({ id, name, type, value, pinned }) => ({ id, name, type, value, pinned }))
        const updatedSettings = {
          ...currentSettings,
          pinned_charges: pinned
        }
        await auth.updateProfile({ settings: updatedSettings })
      }
    },
  }
})

// Selectors (use outside with shallow)
export const selectSubtotal = (s) =>
  s.items.reduce((sum, i) => sum + i.price * i.qty, 0)

export const selectItemCount = (s) => s.items.length

