import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'
import { idbStorage } from '@/lib/idbStorage'

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpieza', 'Electrónica', 'Ropa', 'Servicios', 'Otros']
export { CATEGORIES }

export function getProductDiscount(product) {
  if (!product.discount_value || product.discount_value <= 0) return null
  if (product.discount_ends_at && new Date(product.discount_ends_at) < new Date()) return null
  
  const amount = product.discount_type === 'percentage' 
    ? product.price * (product.discount_value / 100)
    : product.discount_value
    
  return {
    finalPrice: Math.max(0, product.price - amount),
    amount,
    type: product.discount_type,
    value: product.discount_value
  }
}

const STALE_TIME = 1000 * 60 * 60 * 24 // 24 horas

export const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],
      loading: false,
      lastFetch: 0,

  addCustomCategory: async (newCat) => {
    const auth = useAuthStore.getState()
    if (!auth.isAuthenticated || !auth.user?.companyId) return
    const currentSettings = auth.user.settings || {}
    const customCats = currentSettings.custom_categories || []
    if (customCats.includes(newCat)) return

    const updatedSettings = {
      ...currentSettings,
      custom_categories: [...customCats, newCat]
    }
    await auth.updateProfile({ settings: updatedSettings })
  },

  fetchProducts: async (force = false) => {
    const { lastFetch } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId) return
    
    const isStale = Date.now() - lastFetch > STALE_TIME
    if (!isStale && !force) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', user.companyId)
      .order('name')

    if (!error) set({ products: data || [], lastFetch: Date.now() })
    set({ loading: false })
  },

  addProduct: async (data) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    const newProduct = {
      ...data,
      company_id: user.companyId,
    }

    const { data: saved, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single()

    if (error) {
      console.error('❌ Error adding product:', error)
      import('react-hot-toast').then(m => m.default.error(`Error DB: ${error.message}`))
      return null
    }

    set((s) => ({ products: [...s.products, saved] }))
    return saved
  },

  updateProduct: async (id, data) => {
    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)

    if (!error) {
      set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }))

      // Low stock alert: fire when stock drops to 5 or below
      if (typeof data.stock === 'number' && data.stock <= 5) {
        const updatedProduct = get().products.find(p => p.id === id)
        if (updatedProduct && updatedProduct.unit !== 'ILIMITADO') {
          import('../services/emailService').then(({ sendLowStockEmail }) => {
            const { user } = useAuthStore.getState()
            if (user?.email) {
              const company = { companyName: user.companyName || 'GestivaOne', companyLogo: user.companyLogo || null }
              sendLowStockEmail({ ...updatedProduct, ...data }, user.email, company).catch(() => {})
            }
          }).catch(() => {})
        }
      }
    }
  },

  deleteProduct: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (!error) {
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }))
    }
  },

  getByCategory: (cat) =>
    cat ? get().products.filter((p) => p.category === cat) : get().products,
    }),
    {
      name: 'gestiva-products-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ products: state.products, lastFetch: state.lastFetch }),
    }
  )
)
