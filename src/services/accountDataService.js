import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProductStore } from '@/store/useProductStore'
import { useClientStore } from '@/store/useClientStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useExpenseStore } from '@/store/useExpenseStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { usePocketStore } from '@/store/usePocketStore'

const COMPANY_TABLES = [
  'products',
  'clients',
  'expenses',
  'notifications',
  'invoices',
  'invoice_payments',
]

const JSON_FIELDS = new Set(['items', 'settings', 'permissions'])

const stringifyCell = (value) => {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value)
  return value
}

const parseCell = (key, value) => {
  if (value === '') return null
  if (JSON_FIELDS.has(key) && typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

const normalizeRowsForSheet = (rows) =>
  rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, stringifyCell(value)])))

const readSheet = (workbook, name) => {
  const sheet = workbook.Sheets[name]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }).map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, parseCell(key, value)]))
  )
}

const fetchTable = async (table, companyId) => {
  const { data, error } = await supabase.from(table).select('*').eq('company_id', companyId)
  if (error) throw new Error(`${table}: ${error.message}`)
  return data || []
}

const fetchPersonalLoans = async (userId) => {
  const { data, error } = await supabase.from('personal_loans').select('*').eq('user_id', userId)
  if (error) return []
  return data || []
}

const getCompany = async (companyId) => {
  const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).limit(1)
  if (error) throw new Error(`companies: ${error.message}`)
  return data?.[0] || null
}

const getProfiles = async (companyId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('company_id', companyId)
  if (error) throw new Error(`profiles: ${error.message}`)
  return data || []
}

export const exportAccountBackup = async () => {
  const { user } = useAuthStore.getState()
  if (!user?.companyId) throw new Error('No hay empresa activa')

  const workbook = XLSX.utils.book_new()
  const exportedAt = new Date().toISOString()

  const metadata = [{
    backup_type: 'gestivaone_account_backup',
    version: '1.0',
    exported_at: exportedAt,
    company_id: user.companyId,
    user_id: user.id,
    company_name: user.companyName || '',
  }]

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metadata), 'metadata')

  const company = await getCompany(user.companyId)
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalizeRowsForSheet(company ? [company] : [])), 'companies')

  const profiles = await getProfiles(user.companyId)
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalizeRowsForSheet(profiles)), 'profiles')

  for (const table of COMPANY_TABLES) {
    const rows = await fetchTable(table, user.companyId)
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalizeRowsForSheet(rows)), table)
  }

  const personalLoans = await fetchPersonalLoans(user.id)
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalizeRowsForSheet(personalLoans)), 'personal_loans')

  XLSX.writeFile(workbook, `Backup_GestivaOne_${user.companyName || 'empresa'}_${exportedAt.slice(0, 10)}.xlsx`)
}

export const clearAccountData = async () => {
  const { user, updateProfile } = useAuthStore.getState()
  if (!user?.companyId) throw new Error('No hay empresa activa')

  const deleteCompanyRows = async (table) => {
    const { error } = await supabase.from(table).delete().eq('company_id', user.companyId)
    if (error) throw new Error(`${table}: ${error.message}`)
  }

  const deletePersonalLoans = await supabase.from('personal_loans').delete().eq('user_id', user.id)
  if (deletePersonalLoans.error && deletePersonalLoans.error.code !== '42P01') {
    throw new Error(`personal_loans: ${deletePersonalLoans.error.message}`)
  }

  for (const table of ['invoice_payments', 'notifications', 'expenses', 'invoices', 'clients', 'products']) {
    await deleteCompanyRows(table)
  }

  await updateProfile({
    settings: {
      ...(user.settings || {}),
      pockets: [],
      custom_categories: [],
    },
  })

  await refreshAccountStores()
}

export const importAccountBackup = async (file) => {
  const { user, updateProfile } = useAuthStore.getState()
  if (!user?.companyId) throw new Error('No hay empresa activa')

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const metadata = readSheet(workbook, 'metadata')?.[0]
  if (metadata?.backup_type !== 'gestivaone_account_backup') {
    throw new Error('El archivo no corresponde a un backup de GestivaOne')
  }

  await clearAccountData()

  const companyRows = readSheet(workbook, 'companies')
  const company = companyRows[0]
  if (company?.settings) {
    await updateProfile({ settings: company.settings })
  }

  const prepareCompanyRows = (rows) =>
    rows.map((row) => ({
      ...row,
      company_id: user.companyId,
    }))

  const insertRows = async (table, rows) => {
    if (!rows.length) return
    const { error } = await supabase.from(table).insert(rows)
    if (error) throw new Error(`${table}: ${error.message}`)
  }

  await insertRows('products', prepareCompanyRows(readSheet(workbook, 'products')))
  await insertRows('clients', prepareCompanyRows(readSheet(workbook, 'clients')))
  await insertRows('expenses', prepareCompanyRows(readSheet(workbook, 'expenses')))
  await insertRows('invoices', prepareCompanyRows(readSheet(workbook, 'invoices')))
  await insertRows('invoice_payments', prepareCompanyRows(readSheet(workbook, 'invoice_payments')))
  await insertRows('notifications', prepareCompanyRows(readSheet(workbook, 'notifications')))

  const personalLoans = readSheet(workbook, 'personal_loans').map((row) => ({
    ...row,
    user_id: user.id,
  }))
  await insertRows('personal_loans', personalLoans)

  await refreshAccountStores()
}

export const refreshAccountStores = async () => {
  useProductStore.setState({ products: [], productsFetched: false })
  useClientStore.setState({ clients: [], clientsFetched: false, selectedClientId: null })
  useInvoiceStore.setState({ invoices: [], invoicesFetched: false })
  useExpenseStore.setState({ expenses: [], expensesFetched: false })
  useNotificationStore.setState({ notifications: [] })
  usePocketStore.setState({ pockets: [] })

  await Promise.allSettled([
    useProductStore.getState().fetchProducts(true),
    useClientStore.getState().fetchClients(true),
    useInvoiceStore.getState().fetchInvoices(true),
    useExpenseStore.getState().fetchExpenses(true),
    useNotificationStore.getState().fetchNotifications(),
  ])
  usePocketStore.getState().fetchPockets()
}
