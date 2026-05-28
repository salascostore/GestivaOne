import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useClientStore = create((set, get) => ({
  clients: [],
  selectedClientId: null,
  loading: false,

  clientsFetched: false,

  fetchClients: async (force = false) => {
    const { clientsFetched } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId || (clientsFetched && !force)) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (!error) set({ clients: data || [], clientsFetched: true })
    set({ loading: false })
  },

  addClient: async (data) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    const cleanDocumentId = data.document_id && data.document_id.trim() !== '' ? data.document_id.trim() : null

    const newClient = {
      ...data,
      company_id: user.companyId,
      type: data.type ?? 'frequent',
      document_id: cleanDocumentId
    }

    const { data: saved, error } = await supabase
      .from('clients')
      .insert([newClient])
      .select()
      .single()

    if (error) {
      console.error('❌ Error adding client:', error)
      import('react-hot-toast').then(m => m.default.error(`Error: ${error.message}`))
      return null
    }

    set((s) => ({ clients: [saved, ...s.clients] }))
    return saved
  },

  updateClient: async (id, data) => {
    const cleanDocumentId = data.document_id && data.document_id.trim() !== '' ? data.document_id.trim() : null
    const cleanData = {
      ...data,
      document_id: cleanDocumentId
    }

    const { error } = await supabase
      .from('clients')
      .update(cleanData)
      .eq('id', id)

    if (!error) {
      set((s) => ({
        clients: s.clients.map((c) => (c.id === id ? { ...c, ...cleanData } : c)),
      }))
    }
  },

  deleteClient: async (id) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (!error) {
      set((s) => ({
        clients: s.clients.filter((c) => c.id !== id),
        selectedClientId: s.selectedClientId === id ? null : s.selectedClientId,
      }))
    }
  },

  selectClient: (id) => set({ selectedClientId: id }),
  clearSelection: () => set({ selectedClientId: null }),

  getSelected: () => {
    const { clients, selectedClientId } = get()
    return clients.find((c) => c.id === selectedClientId) ?? null
  },

  getFrequent: () => get().clients.filter((c) => c.type === 'frequent'),
}))

