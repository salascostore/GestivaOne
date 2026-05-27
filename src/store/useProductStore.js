import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpieza', 'Electrónica', 'Ropa', 'Servicios', 'Otros']
export { CATEGORIES }

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  productsFetched: false,

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
    const { productsFetched } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId || (productsFetched && !force)) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', user.companyId)
      .order('name')

    if (!error) set({ products: data || [], productsFetched: true })
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
}))

