import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'
import { idbStorage } from '@/lib/idbStorage'

const STALE_TIME = 1000 * 60 * 60 * 24 // 24 horas

export const useClientStore = create(
  persist(
    (set, get) => ({
      clients: [],
      selectedClientId: null,
      loading: false,
      lastFetch: 0,

  fetchClients: async (force = false) => {
    const { lastFetch } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId) return
    
    const isStale = Date.now() - lastFetch > STALE_TIME
    if (!isStale && !force) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (!error) set({ clients: data || [], lastFetch: Date.now() })
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

    // Notify admin via email asynchronously
    import('../services/emailService').then(({ sendNewClientEmail }) => {
      if (user?.email) {
        const company = { companyName: user.companyName || 'GestivaOne', companyLogo: user.companyLogo || null }
        sendNewClientEmail(saved, user.email, company).catch(() => {})
      }
    }).catch(() => {})

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

  getFrequent: () => get().clients.filter((c) => !c.type || c.type === 'frequent'),
    }),
    {
      name: 'gestiva-clients-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ clients: state.clients, lastFetch: state.lastFetch }),
    }
  )
)

