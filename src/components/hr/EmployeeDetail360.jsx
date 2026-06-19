import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, ShieldCheck, Mail, Phone, Calendar, Briefcase, DollarSign, Building, CreditCard, Folder, Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function EmployeeDetail360({ employee, allEmployees = [], onUpdate, onClose }) {
  const [activeTab, setActiveTab] = useState('contract') // contract, docs, payroll
  
  // Form states
  const [fullName, setFullName] = useState(employee.full_name)
  const [phone, setPhone] = useState(employee.phone || '')
  const [documentId, setDocumentId] = useState(employee.document_id || '')
  const [salary, setSalary] = useState(employee.salary || 1300000)
  const [position, setPosition] = useState(employee.position || '')
  const [department, setDepartment] = useState(employee.department || '')
  const [reportsTo, setReportsTo] = useState(employee.reports_to || '')
  const [arlClass, setArlClass] = useState(employee.arl_class || 'clase_1')
  const [bankAccount, setBankAccount] = useState(employee.bank_account || '')
  const [bankName, setBankName] = useState(employee.bank_name || '')
  
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Simulated Document management
  const [docs, setDocs] = useState([
    { name: 'Contrato_Laboral_Firmado.pdf', date: '2025-03-05', size: '1.2 MB' },
    { name: 'Cedula_Ciudadania.pdf', date: '2025-03-02', size: '840 KB' },
    { name: 'Certificado_EPS_FondoPensiones.pdf', date: '2025-03-02', size: '2.1 MB' }
  ])

  const handleUploadDoc = () => {
    const docName = prompt('Ingresa el nombre del documento (ej: RUT_Actualizado.pdf):', '')
    if (!docName) return
    setDocs(d => [...d, {
      name: docName.endsWith('.pdf') ? docName : docName + '.pdf',
      date: new Date().toISOString().split('T')[0],
      size: '450 KB'
    }])
    toast.success('Documento cargado correctamente')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const success = await onUpdate(employee.id, {
      full_name: fullName,
      phone,
      document_id: documentId,
      salary: Number(salary),
      position,
      department,
      reports_to: reportsTo || null,
      arl_class: arlClass,
      bank_account: bankAccount,
      bank_name: bankName
    })
    setSaving(false)
    if (success) {
      setIsEditing(false)
    }
  }

  return (
    <div className="bg-surface-800 border border-subtle rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Employee Main Header Node */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-black text-sm">
            {employee.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">{employee.full_name}</h3>
            <p className="text-[10px] text-muted-400 font-bold uppercase tracking-wider">{employee.position} — {employee.department}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="sm"
              className="rounded-xl py-1.5"
            >
              Editar Perfil
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(false)}
              variant="secondary"
              size="sm"
              className="rounded-xl py-1.5"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="rounded-xl py-1.5 border"
          >
            Cerrar
          </Button>
        </div>
      </div>

      {/* Tabs list (contract, docs) */}
      <div className="flex border-b border-subtle/50 text-xs font-bold text-muted-400 uppercase select-none">
        <button
          onClick={() => setActiveTab('contract')}
          className={`pb-2.5 px-4 border-b-2 transition-all ${activeTab === 'contract' ? 'border-brand-500 text-brand-500 font-black' : 'border-transparent hover:text-foreground'}`}
        >
          Contrato y Datos
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-2.5 px-4 border-b-2 transition-all ${activeTab === 'docs' ? 'border-brand-500 text-brand-500 font-black' : 'border-transparent hover:text-foreground'}`}
        >
          Documentos y Expediente
        </button>
      </div>

      {/* Tab 1: Contract and Data Form */}
      {activeTab === 'contract' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Nombre Completo</label>
              <input
                disabled={!isEditing}
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Email (static) */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Email institucional</label>
              <div className="w-full bg-surface-900/40 border border-subtle rounded-xl px-3 py-2 text-xs text-muted-500 select-all truncate">
                {employee.email}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Teléfono</label>
              <input
                disabled={!isEditing}
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Document ID */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Cédula / Documento</label>
              <input
                disabled={!isEditing}
                type="text"
                value={documentId}
                onChange={e => setDocumentId(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Salario Mensual (COP)</label>
              <input
                disabled={!isEditing}
                type="number"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Position */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Cargo</label>
              <input
                disabled={!isEditing}
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Área o Departamento</label>
              <input
                disabled={!isEditing}
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Reports To */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Jerarquía (¿A quién reporta?)</label>
              <select
                disabled={!isEditing}
                value={reportsTo}
                onChange={e => setReportsTo(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              >
                <option value="">Nadie / Director</option>
                {allEmployees.map(emp => {
                  if (emp.id === employee.id) return null // Can't report to self
                  return <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                })}
              </select>
            </div>

            {/* ARL Class */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Riesgo Laboral (ARL)</label>
              <select
                disabled={!isEditing}
                value={arlClass}
                onChange={e => setArlClass(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              >
                <option value="clase_1">Clase I (Oficina / Admin - 0.522%)</option>
                <option value="clase_2">Clase II (Ventas / Logística - 1.044%)</option>
                <option value="clase_3">Clase III (Transporte / Almacén - 2.436%)</option>
                <option value="clase_4">Clase IV (Manufacturas - 4.35%)</option>
                <option value="clase_5">Clase V (Alto Riesgo - 6.96%)</option>
              </select>
            </div>

            {/* Bank Name */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Banco de Nómina</label>
              <input
                disabled={!isEditing}
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                placeholder="Ej: Bancolombia"
              />
            </div>

            {/* Bank Account */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-500 mb-1.5 block">Número Cuenta de Ahorros</label>
              <input
                disabled={!isEditing}
                type="text"
                value={bankAccount}
                onChange={e => setBankAccount(e.target.value)}
                className="w-full bg-surface-900/60 disabled:opacity-60 disabled:cursor-not-allowed border border-subtle rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                placeholder="Ej: 9876543210"
              />
            </div>
          </div>

          {/* Form Save Action */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl px-6 py-2"
                icon={<Check size={14} />}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Document Management */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Expediente de Documentos</h4>
            <Button
              onClick={handleUploadDoc}
              variant="secondary"
              size="sm"
              className="rounded-xl py-1.5 border"
            >
              Cargar Documento
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docs.map((doc, idx) => (
              <div key={idx} className="bg-surface-900/40 border border-subtle/80 p-4 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-2xl">
                    <Folder size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground truncate max-w-[150px]" title={doc.name}>{doc.name}</p>
                    <p className="text-[9px] text-muted-500 uppercase mt-0.5 font-bold">{doc.date} — {doc.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDocs(d => d.filter((_, i) => i !== idx))}
                  className="text-muted-500 hover:text-danger-500 transition-colors p-1.5 rounded-lg hover:bg-danger-500/10"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
