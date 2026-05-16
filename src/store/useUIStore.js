import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Apply the correct dark/light class based on theme value
const applyTheme = (theme) => {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

export { applyTheme }

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed:  false,
      mobileSidebarOpen: false,
      theme: 'dark', // 'dark' | 'light' | 'system'
      activeModal:   null,
      editingProduct: null,
      editingClient:  null,
      invoicePanelOpen: true,

      toggleSidebar:     () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar:() => set({ mobileSidebarOpen: false }),

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      openModal: (name, payload = null) =>
        set({ activeModal: name, editingProduct: payload?.product ?? null, editingClient: payload?.client ?? null }),

      closeModal: () =>
        set({ activeModal: null, editingProduct: null, editingClient: null }),

      toggleInvoicePanel: () =>
        set((s) => ({ invoicePanelOpen: !s.invoicePanelOpen })),
    }),
    {
      name: 'gestiva-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        theme: s.theme,
        invoicePanelOpen: s.invoicePanelOpen,
        // mobileSidebarOpen intentionally NOT persisted
      }),
    }
  )
)
