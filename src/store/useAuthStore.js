import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export const PLANS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 55000,
    priceDisplay: '$55.000',
    period: '/mes',
    promoPrice: null,
    promoMonths: 0,
    color: 'brand',
    features: [
      'Hasta 2 usuarios',
      'Facturación ilimitada',
      'Gestión de clientes',
      'Inventario básico',
      'Soporte por email',
    ],
    // Limits
    maxUsers: 2,
    hasReports: false,
    hasAdvancedDashboard: false,
    hasAPI: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 120000,
    priceDisplay: '$120.000',
    promoPrice: 96000,
    promoPriceDisplay: '$96.000',
    promoMonths: 3,
    promoLabel: '20% desc. primeros 3 meses',
    period: '/mes',
    color: 'brand',
    popular: true,
    features: [
      'Hasta 10 usuarios',
      'Todo lo de Standard',
      'Dashboard avanzado',
      'Gestión de empleados',
      'Reportes PDF/Excel',
      'Soporte prioritario',
    ],
    // Limits
    maxUsers: 10,
    hasReports: true,
    hasAdvancedDashboard: true,
    hasAPI: false,
  },
  empresarial: {
    id: 'empresarial',
    name: 'Empresarial',
    price: 400000,
    priceDisplay: '$400.000',
    promoPrice: null,
    promoMonths: 0,
    period: '/mes',
    color: 'brand',
    features: [
      'Usuarios ilimitados',
      'Todo lo de Pro',
      'Multi-sucursal',
      'API personalizada',
      'Gerente de cuenta dedicado',
      'SLA 99.9%',
    ],
    // Limits
    maxUsers: 999999,
    hasReports: true,
    hasAdvancedDashboard: true,
    hasAPI: true,
  },
  master: {
    id: 'master',
    name: 'Master Admin',
    price: 0,
    priceDisplay: '$0',
    period: '/siempre',
    color: 'brand',
    features: ['Acceso total ilimitado'],
    maxUsers: 999999,
    hasReports: true,
    hasAdvancedDashboard: true,
    hasAPI: true,
  }
}

const SUPER_ADMINS = [
  { email: 'admin@gestivaone.com', pass: 'Admin220307@' },
  { email: 'soporte@gestivaone.com', pass: 'Gestiva2026!' }
]

export const ROLES = {
  administrador: {
    label: 'Administrador',
    color: 'brand',
    permissions: {
      dashboard: true,
      menu: true,
      products: true,
      settings: true,
      employees: true,
      account: true,
    },
  },
  despachador: {
    label: 'Despachador',
    color: 'warning',
    permissions: {
      dashboard: false,
      menu: true,
      products: true,
      settings: false,
      employees: false,
      account: true,
    },
  },
  contable: {
    label: 'Contable',
    color: 'success',
    permissions: {
      dashboard: true,
      menu: false,
      products: false,
      settings: false,
      employees: false,
      account: true,
    },
  },
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      loading: false,

      // Initial session check
      init: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await get().syncProfile(session.user.id)
        }
      },

      register: async (data) => {
        set({ loading: true })
        
        // 1. Auth Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        })

        if (authError) {
          set({ loading: false })
          return { success: false, error: authError.message }
        }

        const userId = authData.user.id

        // 2. Create Company
        const { data: company, error: compError } = await supabase
          .from('companies')
          .insert([{ name: data.companyName, logo_url: data.companyLogo }])
          .select()
          .single()

        if (compError) {
          set({ loading: false })
          return { success: false, error: 'Error al crear empresa: ' + compError.message }
        }

        // 3. Create Profile
        const isSuperAdmin = data.email === SUPER_ADMIN_EMAIL

        const { error: profError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            company_id: company.id,
            full_name: data.name,
            phone: data.phone,
            plan: isSuperAdmin ? 'master' : data.plan,
            role: 'administrador'
          }])

        if (profError) {
          set({ loading: false })
          return { success: false, error: 'Error al crear perfil: ' + profError.message }
        }

        await get().syncProfile(userId)
        set({ loading: false })
        return { success: true }
      },

      login: async (email, password) => {
        set({ loading: true })
        
        // ── Master Admin Bypass (Hardcoded Session) ─────────────────
        const adminEntry = SUPER_ADMINS.find(a => a.email === email && a.pass === password)
        
        if (adminEntry) {
          const mockUser = {
            id: adminEntry.email === SUPER_ADMINS[0].email ? 'master-owner-id' : 'master-support-id',
            name: adminEntry.email === SUPER_ADMINS[0].email ? 'Administrador Dueño' : 'Soporte Gestiva',
            email: adminEntry.email,
            role: 'administrador',
            plan: 'master',
            companyId: 'master-company-id',
            companyName: 'GestivaOne Master',
            companyLogo: null,
          }
          
          set({ isAuthenticated: true, user: mockUser })
          set({ loading: false })
          toast.success('Acceso Maestro Concedido')
          return { success: true, role: 'administrador' }
        }
        
        // ── Normal Supabase Login ────────────────────────────────────
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) {
          set({ loading: false })
          return { success: false, error: 'Correo o contraseña incorrectos' }
        }

        await get().syncProfile(data.user.id)
        set({ loading: false })
        return { success: true, role: get().user?.role }
      },

      syncProfile: async (userId) => {
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select(`
            *,
            companies (*)
          `)
          .eq('id', userId)
          .single()

        if (profError || !profile) return

        const { data: { user: authUser } } = await supabase.auth.getUser()

        const isSuperAdmin = SUPER_ADMINS.some(a => a.email === authUser?.email)

        const user = {
          id: profile.id,
          name: profile.full_name,
          email: authUser?.email,
          phone: profile.phone,
          role: profile.role,
          plan: isSuperAdmin ? 'master' : profile.plan,
          companyId: profile.company_id,
          companyName: profile.companies?.name,
          companyLogo: profile.companies?.logo_url,
          settings: profile.companies?.settings
        }

        set({ isAuthenticated: true, user })
      },

      loginAsWorker: (workerData) => {
        set({ isAuthenticated: true, user: { ...workerData, isWorker: true } })
        return { success: true }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ isAuthenticated: false, user: null })
      },

      updateProfile: async (data) => {
        const { user } = get()
        if (!user) return

        // Update profile in DB
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: data.name,
            phone: data.phone
          })
          .eq('id', user.id)

        if (!error) {
          await get().syncProfile(user.id)
        }
      },
    }),
    {
      name: 'gestiva-auth-v2', // Changed name to avoid localStorage conflicts with old version
    }
  )
)

