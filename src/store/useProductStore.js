import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

const CATEGORIES = ['Alimentos', 'Bebidas', 'Limpieza', 'Electrónica', 'Ropa', 'Servicios', 'Otros']
export { CATEGORIES }

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  productsFetched: false,

  fetchProducts: async (force = false) => {
    const { user, productsFetched } = get()
    if (!user || (productsFetched && !force)) return
    
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

    if (!error) {
      set((s) => ({ products: [...s.products, saved] }))
      return saved
    }
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

