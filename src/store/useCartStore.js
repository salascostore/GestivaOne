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

export const useCartStore = create((set, get) => ({
  items: [],   // { id, productId, name, price, qty, unit, isCustom }
  note: '',
  includeTax: false,
  customCharges: [], // { id, name, type: 'percent'|'fixed', value, applied, pinned }

  toggleTax: () => set((s) => ({ includeTax: !s.includeTax })),

  addItem: (product, qty = 1) => {
    set((s) => {
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
    set((s) => ({
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
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  updateQty: (id, qty) => {
    if (qty <= 0) { get().removeItem(id); return }
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, qty: Number(qty) } : i)),
    }))
  },

  updatePrice: (id, price) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, price: Number(price) } : i)),
    })),

  setNote: (note) => set({ note }),

  clearCart: () => {
    // Keep pinned custom charges when clearing cart
    const pinned = get().customCharges.filter(c => c.pinned)
    set({ items: [], note: '', includeTax: false, customCharges: pinned.map(c => ({ ...c, applied: true })) })
  },

  addCustomCharge: async (charge) => {
    const newCharge = {
      id: `charge-${Date.now()}`,
      applied: true,
      pinned: false,
      ...charge
    }
    set((s) => ({ customCharges: [...s.customCharges, newCharge] }))
    if (charge.pinned) {
      await get().savePinnedChargesToDB()
    }
  },

  removeCustomCharge: async (id) => {
    const wasPinned = get().customCharges.find(c => c.id === id)?.pinned
    set((s) => ({ customCharges: s.customCharges.filter(c => c.id !== id) }))
    if (wasPinned) {
      await get().savePinnedChargesToDB()
    }
  },

  toggleCustomChargeApplied: (id) => {
    set((s) => ({
      customCharges: s.customCharges.map(c => c.id === id ? { ...c, applied: !c.applied } : c)
    }))
  },

  toggleCustomChargePin: async (id) => {
    let updatedCharges = []
    set((s) => {
      updatedCharges = s.customCharges.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)
      return { customCharges: updatedCharges }
    })
    await get().savePinnedChargesToDB()
  },

  loadPinnedCharges: () => {
    const auth = useAuthStore.getState()
    const pinned = auth.user?.settings?.pinned_charges || []
    set({
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

  get subtotal() {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },

  get taxAmount() {
    const sub = get().subtotal
    const baseCurrency = useCurrencyStore.getState().baseCurrency
    const taxRate = TAX_RATES[baseCurrency] ?? 0.0
    return get().includeTax ? sub * taxRate : 0
  },

  get customChargesSum() {
    const sub = get().subtotal
    return get().customCharges
      .filter(c => c.applied)
      .reduce((sum, c) => {
        const val = Number(c.value || 0)
        if (c.type === 'percent') {
          return sum + (sub * (val / 100))
        } else {
          return sum + val
        }
      }, 0)
  },

  get total() {
    return get().subtotal + get().taxAmount + get().customChargesSum
  },
}))

// Selectors (use outside with shallow)
export const selectSubtotal = (s) =>
  s.items.reduce((sum, i) => sum + i.price * i.qty, 0)

export const selectItemCount = (s) => s.items.length
