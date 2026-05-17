import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useEmployeeStore = create((set, get) => ({
  employees: [],
  loading: false,

  employeesFetched: false,

  fetchEmployees: async (force = false) => {
    const { employeesFetched } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId || (employeesFetched && !force)) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', user.companyId)
      .not('id', 'eq', user.id) // Exclude current owner

    if (!error) set({ employees: data || [], employeesFetched: true })
    set({ loading: false })
  },

  addEmployee: async (data) => {
    const { user, PLANS } = useAuthStore.getState()
    if (!user) return

    const planLimits = PLANS[user.plan] || PLANS.standard
    const currentCount = get().employees.length + 1 // +1 for the owner

    if (currentCount >= planLimits.maxUsers) {
      throw new Error(`Límite alcanzado: Tu plan ${planLimits.name} solo permite ${planLimits.maxUsers} usuarios.`)
    }

    // Note: In a real app, creating a worker with Auth requires a backend/Edge function.
    // For now, we store the worker in the profiles table with a dummy ID or password field.
    // Ideally, the admin would invite the worker via email.
    
    const newWorkerId = Math.random().toString(36).substring(2, 15) // Placeholder ID

    const { data: saved, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(), // Mock UUID if not using Supabase Auth for workers yet
        company_id: user.companyId,
        full_name: data.name,
        email: data.email,
        role: data.role || 'despachador',
        phone: data.phone || '',
      }])
      .select()
      .single()

    if (!error) {
      set((s) => ({ employees: [...s.employees, saved] }))
      return saved
    }
  },

  updateRole: async (id, role) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (!error) {
      set((s) => ({
        employees: s.employees.map((e) =>
          e.id === id ? { ...e, role } : e
        ),
      }))
    }
  },

  toggleActive: async (id, currentStatus) => {
    // We could add an 'active' column to profiles.
    // For now, we simulate or skip if column doesn't exist.
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === id ? { ...e, active: !e.active } : e
      ),
    }))
  },

  removeEmployee: async (id) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (!error) {
      set((s) => ({
        employees: s.employees.filter((e) => e.id !== id),
      }))
    }
  },

  loginEmployee: async (email, password) => {
    // In this simulation, we check the profiles table.
    // In production, this would be a Supabase Auth login.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data
  },
}))

