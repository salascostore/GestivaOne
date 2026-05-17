import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export const PLANS = {
  standard: {
    id: 'standard',
    name: 'Standard (Gratis)',
    price: 0,
    priceDisplay: '$0',
    period: '/siempre',
    promoPrice: null,
    promoMonths: 0,
    color: 'brand',
    features: [
      '1 usuario único',
      'Facturación básica',
      'Gestión de clientes',
      'Inventario limitado',
      'Soporte comunitario',
    ],
    // Limits
    maxUsers: 1,
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
    name: 'Gestiva 360',
    price: 163200,
    priceDisplay: '$163.200',
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

// Removed hardcoded SUPER_ADMINS for security. Use Supabase roles instead.

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
          .insert([{ 
            name: data.companyName, 
            logo_url: data.companyLogo,
            owner_id: userId // Linking the creator as the owner
          }])
          .select()
          .single()

        if (compError) {
          set({ loading: false })
          return { success: false, error: 'Error al crear empresa: ' + compError.message }
        }

        // 3. Create Profile
        const { error: profError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            company_id: company.id,
            full_name: data.name || 'Usuario',
            email: data.email,
            phone: data.phone || '',
            plan: data.plan || 'standard',
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
        try {
          // 1. Fetch Profile (using array instead of .single() to avoid 406 headers)
          const { data: profileList, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .limit(1)
          
          const profile = profileList?.[0]
          const { data: { user: authUser } } = await supabase.auth.getUser()

          if (profError || !profile) {
            console.warn('Profile not found, attempting to recover company...')
            // Try to find a company owned by this user
            const { data: ownedCompanies } = await supabase
              .from('companies')
              .select('id, name')
              .eq('owner_id', userId)
              .limit(1)

            const ownedCompany = ownedCompanies?.[0]
            
            // Fallback user with recovered company or temp one
            const fallbackUser = {
              id: userId,
              name: authUser?.email?.split('@')[0] || 'Usuario',
              email: authUser?.email,
              role: 'administrador',
              plan: 'standard',
              companyId: ownedCompany?.id || null,
              companyName: ownedCompany?.name || 'GestivaOne',
              companyLogo: null,
              country: ownedCompany?.country || null,
            }
            set({ isAuthenticated: true, user: fallbackUser })
            return
          }

          // 2. Fetch Company
          const { data: companyList } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .limit(1)

          const company = companyList?.[0]

          const user = {
            id: profile.id,
            name: profile.full_name,
            email: authUser?.email,
            phone: profile.phone,
            role: profile.role,
            plan: profile.plan,
            companyId: profile.company_id,
            companyName: company?.name || 'Mi Empresa',
            companyLogo: company?.logo_url,
            country: company?.country || null,
            settings: company?.settings
          }

          set({ isAuthenticated: true, user })
        } catch (err) {
          console.error('Sync Profile Error:', err)
          // Last resort fallback to let user in
          set({ isAuthenticated: true, user: { id: userId, email: 'user@gestivaone.com', role: 'administrador' } })
        }
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

        // Bypass for Master Admin (no DB profile)
        if (user.id.startsWith('master-')) {
          set({ user: { ...user, ...data } })
          return
        }

        // 1. Update Profile
        const profileUpdates = {}
        if (data.name !== undefined) profileUpdates.full_name = data.name
        if (data.phone !== undefined) profileUpdates.phone = data.phone
        if (data.company_id !== undefined) profileUpdates.company_id = data.company_id

        if (Object.keys(profileUpdates).length > 0) {
          await supabase.from('profiles').update(profileUpdates).eq('id', user.id)
        }

        // 2. Update Company
        const targetCompanyId = user.companyId || data.company_id
        if (targetCompanyId) {
          const companyUpdates = {}
          if (data.companyName !== undefined) companyUpdates.name = data.companyName
          if (data.companyLogo !== undefined) companyUpdates.logo_url = data.companyLogo
          if (data.country !== undefined) companyUpdates.country = data.country
          if (data.base_currency !== undefined) companyUpdates.currency = data.base_currency

          if (Object.keys(companyUpdates).length > 0) {
            await supabase.from('companies').update(companyUpdates).eq('id', targetCompanyId)
          }
        }

        await get().syncProfile(user.id)
      },
    }),
    {
      name: 'gestiva-auth-v2.1', // Bumped version to force a clean state
      onRehydrateStorage: () => (state) => {
        // Auto-refresh logic if needed or version check
        console.log('Auth storage rehydrated')
      }
    }
  )
)

