import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],   // { id, productId, name, price, qty, unit, isCustom }
  note: '',

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

  clearCart: () => set({ items: [], note: '' }),

  get subtotal() {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },

  get total() {
    return get().subtotal
  },
}))

// Selectors (use outside with shallow)
export const selectSubtotal = (s) =>
  s.items.reduce((sum, i) => sum + i.price * i.qty, 0)

export const selectItemCount = (s) => s.items.length
