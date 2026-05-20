import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import InvoicePanel from '@/components/invoice/InvoicePanel'
import AddClientModal  from '@/components/modals/AddClientModal'
import AddProductModal from '@/components/modals/AddProductModal'
import OrderConfirmModal from '@/components/modals/OrderConfirmModal'
import ClientHistoryModal from '@/components/modals/ClientHistoryModal'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useClientStore } from '@/store/useClientStore'
import { useProductStore } from '@/store/useProductStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useEmployeeStore } from '@/store/useEmployeeStore'

export default function AppLayout() {
  console.log('🏗️ AppLayout Rendering...')
  const activeModal = useUIStore((s) => s.activeModal)
  const user        = useAuthStore((s) => s.user)
  
  const fetchClients   = useClientStore((s) => s.fetchClients)
  const fetchProducts  = useProductStore((s) => s.fetchProducts)
  const fetchInvoices  = useInvoiceStore((s) => s.fetchInvoices)
  const fetchEmployees = useEmployeeStore((s) => s.fetchEmployees)

  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen)
  const invoicePanelOpen  = useUIStore((s) => s.invoicePanelOpen)

  // Track if viewport is mobile (< lg breakpoint = 1024px)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Lock body scroll when overlays (modals, mobile drawers) are open to prevent background scrolling
  useEffect(() => {
    const isLocked = !!activeModal || !!mobileSidebarOpen || (isMobile && !!invoicePanelOpen)
    if (isLocked) {
      document.body.classList.add('overflow-hidden', 'h-screen', 'w-screen')
      document.documentElement.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden', 'h-screen', 'w-screen')
      document.documentElement.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden', 'h-screen', 'w-screen')
      document.documentElement.classList.remove('overflow-hidden')
    }
  }, [activeModal, mobileSidebarOpen, invoicePanelOpen, isMobile])

  // ─── Fetch data on login ───
  useEffect(() => {
    if (user?.id) {
      fetchClients()
      fetchProducts()
      fetchInvoices()
      if (user.role === 'administrador') fetchEmployees()
    }
  }, [user?.id])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">

      {/* ─── Sidebar: hidden on mobile, shown on lg+ ─── */}
      <Sidebar isMobile={isMobile} />

      {/* ─── Main column ─── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar visible only on mobile */}
        {isMobile && <TopBar />}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* ─── Invoice Side Panel (drawer on mobile) ─── */}
      <InvoicePanel isMobile={isMobile} />

      {/* Modals */}
      <AddClientModal  open={activeModal === 'addClient'}  />
      <AddProductModal open={activeModal === 'addProduct'} />
      <OrderConfirmModal open={activeModal === 'orderConfirm'} />
      <ClientHistoryModal open={activeModal === 'clientHistory'} />
    </div>
  )
}
