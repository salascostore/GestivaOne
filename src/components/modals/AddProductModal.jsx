import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Tag, DollarSign, Archive, Link2, FileUp, CalendarDays } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useProductStore, CATEGORIES } from '@/store/useProductStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  price: z.coerce.number().positive('Precio inválido'),
  cost: z.coerce.number().min(0, 'Costo inválido').optional().or(z.literal('')),
  unit: z.enum(['KG', 'LB', 'UND', 'L', 'M']),
  category: z.string().optional(),
  stock: z.coerce.number().min(0).optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
  discount_type: z.string().optional().nullable(),
  discount_value: z.coerce.number().min(0).optional().nullable(),
  discount_ends_at: z.string().optional().nullable(),
})

const UNITS = ['KG', 'LB', 'UND', 'L', 'M']
const UNIT_LABELS = {}

export default function AddProductModal({ open }) {
  const addProduct    = useProductStore((s) => s.addProduct)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const closeModal    = useUIStore((s) => s.closeModal)
  const editing       = useUIStore((s) => s.editingProduct)
  const duplicating   = useUIStore((s) => s.duplicatingProduct)
  const baseCurrency  = useCurrencyStore((s) => s.baseCurrency)

  const userSettings = useAuthStore((s) => s.user?.settings)
  const customCats = userSettings?.custom_categories || []
  const dynamicCategories = [...CATEGORIES.filter(c => c !== 'Otros'), ...customCats, 'Otros']

  const [customCategoryName, setCustomCategoryName] = useState('')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'UND', stock: 0, category: 'Otros', cost: 0, attachment_url: '', attachment_name: '', discount_type: 'percentage', discount_value: 0, discount_ends_at: '' },
  })

  const unit = watch('unit')
  const selectedCategory = watch('category')

  // Derived state for unlimited
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userSettings?.id || 'public'}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: signedData, error: signedError } = await supabase.storage
        .from('attachments')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10) // Válido por 10 años (URL segura/ofuscada)

      if (signedError) throw signedError

      setValue('attachment_url', signedData.signedUrl)
      setValue('attachment_name', file.name)
      toast.success('Archivo adjuntado correctamente')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Error al subir archivo. Verifica que el bucket "attachments" exista y sea público.')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  useEffect(() => {
    // Duplicating: pre-fill form but treat as new product (no id)
    if (open && duplicating) {
      const isEditingUnlimited = duplicating.unit === 'ILIMITADO' || duplicating.stock >= 999990000
      setIsUnlimited(isEditingUnlimited)
      setHasDiscount(!!duplicating.discount_value && duplicating.discount_value > 0)
      reset({
        ...duplicating,
        name: `${duplicating.name} (Copia)`,
        unit: duplicating.unit === 'ILIMITADO' ? 'UND' : duplicating.unit,
        stock: isEditingUnlimited ? 0 : (duplicating.stock ?? 0),
        cost: duplicating.cost ?? 0,
        attachment_url: duplicating.attachment_url ?? '',
        attachment_name: duplicating.attachment_name ?? '',
        discount_type: duplicating.discount_type || 'percentage',
        discount_value: duplicating.discount_value || 0,
        discount_ends_at: duplicating.discount_ends_at ? duplicating.discount_ends_at.split('T')[0] : ''
      })
      setCustomCategoryName('')
      return
    }
    // Editing existing product
    if (open && editing) {
      const isEditingUnlimited = editing.unit === 'ILIMITADO' || editing.stock >= 999990000
      setIsUnlimited(isEditingUnlimited)
      setHasDiscount(!!editing.discount_value && editing.discount_value > 0)
      reset({
        ...editing,
        unit: editing.unit === 'ILIMITADO' ? 'UND' : editing.unit,
        stock: isEditingUnlimited ? 0 : (editing.stock ?? 0),
        cost: editing.cost ?? 0,
        attachment_url: editing.attachment_url ?? '',
        attachment_name: editing.attachment_name ?? '',
        discount_type: editing.discount_type || 'percentage',
        discount_value: editing.discount_value || 0,
        discount_ends_at: editing.discount_ends_at ? editing.discount_ends_at.split('T')[0] : ''
      })
      setCustomCategoryName('')
    }
    else if (open) {
      setIsUnlimited(false)
      setHasDiscount(false)
      reset({ unit: 'UND', stock: 0, category: 'Otros', name: '', price: '', cost: 0, attachment_url: '', attachment_name: '', discount_type: 'percentage', discount_value: 0, discount_ends_at: '' })
      setCustomCategoryName('')
    }
  }, [open, editing, duplicating, reset])

  const onSubmit = async (data) => {
    let finalCategory = data.category
    if (data.category === 'Otros') {
      const trimmedCustom = customCategoryName.trim()
      if (!trimmedCustom) {
        toast.error('Especifica el nombre de la categoría')
        return
      }
      await useProductStore.getState().addCustomCategory(trimmedCustom)
      finalCategory = trimmedCustom
    }

    const finalData = {
      ...data,
      category: finalCategory,
      stock: isUnlimited ? 999999999 : Number(data.stock || 0),
      discount_value: hasDiscount ? Number(data.discount_value || 0) : null,
      discount_type: hasDiscount ? (data.discount_type || 'percentage') : null,
      discount_ends_at: hasDiscount && data.discount_ends_at ? new Date(data.discount_ends_at + 'T23:59:59').toISOString() : null,
    }

    // Editing an existing product
    if (editing) {
      await updateProduct(editing.id, finalData)
      toast.success('Producto actualizado')
    } else {
      // Both 'new' and 'duplicate' flows create a new product
      await addProduct(finalData)
      toast.success(duplicating ? `${finalData.name} duplicado ✓` : `${finalData.name} añadido`)
    }
    closeModal()
  }

  const modalTitle = editing ? 'Editar Producto' : duplicating ? 'Duplicar Producto' : 'Nuevo Producto'

  return (
    <Modal open={open} onClose={closeModal} title={modalTitle} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre del producto *"
          icon={<Package size={14} />}
          error={errors.name?.message}
          placeholder="Ej: Arroz blanco"
          {...register('name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Precio Venta (${baseCurrency}) *`}
            icon={<DollarSign size={14} />}
            error={errors.price?.message}
            placeholder="0.00"
            type="number"
            step="0.01"
            {...register('price')}
          />
          <Input
            label={`Costo Compra (${baseCurrency})`}
            icon={<DollarSign size={14} />}
            error={errors.cost?.message}
            placeholder="0.00"
            type="number"
            step="0.01"
            {...register('cost')}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-500 uppercase tracking-wide block mb-1.5">Stock disponible</label>
          <div className={clsx(
            'flex items-stretch bg-surface-700 border rounded-xl overflow-hidden transition-all',
            isUnlimited ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-subtle focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/50'
          )}>
            <div className="pl-3 flex items-center text-muted-400">
              <Archive size={14} />
            </div>
            <input
              type="number"
              placeholder="Ej: 999"
              disabled={isUnlimited}
              className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none border-none focus:ring-0 focus:border-transparent focus:outline-none placeholder:text-muted-400 disabled:opacity-50"
              {...register('stock')}
            />
            <button
              type="button"
              onClick={() => {
                setIsUnlimited(!isUnlimited)
                if (!isUnlimited) setValue('stock', 0)
              }}
              className={clsx(
                'px-4 text-xs font-semibold transition-colors border-l border-brand-600',
                isUnlimited
                  ? 'bg-brand-700 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              )}
            >
              {isUnlimited ? '✓' : 'Ilimitado'}
            </button>
          </div>
          {isUnlimited && (
            <p className="text-[11px] text-brand-400 mt-1.5">Stock marcado como ilimitado</p>
          )}
        </div>

        {/* Discount Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-brand-400">
              <Tag size={14} />
              <label className="text-xs font-medium uppercase tracking-wide cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>Añadir Descuento</label>
            </div>
            <button
              type="button"
              onClick={() => setHasDiscount(!hasDiscount)}
              className={clsx(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                hasDiscount ? 'bg-brand-500' : 'bg-surface-600'
              )}
            >
              <span className={clsx('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform', hasDiscount ? 'translate-x-4' : 'translate-x-1')} />
            </button>
          </div>
          
          {hasDiscount && (
            <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-brand-500/5 rounded-xl border border-brand-500/20">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-muted-400 uppercase font-medium">Tipo de descuento</span>
                <select {...register('discount_type')} className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Valor Fijo ($)</option>
                </select>
              </div>
              <Input
                label="Valor"
                type="number"
                placeholder={watch('discount_type') === 'percentage' ? 'Ej: 15' : 'Ej: 5000'}
                {...register('discount_value')}
              />
              <div className="col-span-2">
                <Input
                  label="Válido hasta (Fecha límite)"
                  type="date"
                  {...register('discount_ends_at')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Unit selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-500 uppercase tracking-wide">Unidad</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setValue('unit', u)}
                className={clsx(
                  'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all',
                  unit === u
                    ? 'border-brand-500 bg-brand-600/20 text-brand-600 dark:text-brand-300'
                    : 'border-subtle bg-surface-700 text-muted-400 hover:text-foreground'
                )}
              >
                {UNIT_LABELS[u] || u}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Categoría</label>
          <select
            {...register('category')}
            className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            {dynamicCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {selectedCategory === 'Otros' && (
          <Input
            label="Especificar otra categoría *"
            value={customCategoryName}
            onChange={(e) => setCustomCategoryName(e.target.value)}
            placeholder="Ej: Limpieza Premium"
            required
          />
        )}

        {/* Attachments Section */}
        <div className="pt-2 border-t border-subtle">
          <p className="text-xs font-semibold text-muted-300 mb-2">Archivo Adjunto (Opcional)</p>
          <div className="flex gap-2 mb-2">
            <div className="relative w-full">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
              <label 
                htmlFor="file-upload"
                className={clsx(
                  "flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-bold rounded-xl border transition-all cursor-pointer",
                  uploading ? "opacity-50 cursor-not-allowed border-subtle bg-surface-700 text-muted-400" : "border-brand-500/30 text-brand-400 hover:bg-brand-500/10 hover:border-brand-500"
                )}
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                    Subiendo archivo...
                  </>
                ) : (
                  <>
                    <FileUp size={16} />
                    Subir Archivo
                  </>
                )}
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre del Adjunto"
              icon={<Tag size={14} />}
              placeholder="Ej: Registro INVIMA"
              {...register('attachment_name')}
            />
            <Input
              label="Enlace del Adjunto"
              icon={<Link2 size={14} />}
              placeholder="Ej: https://drive.google.com/..."
              {...register('attachment_url')}
            />
          </div>
          <p className="text-[10px] text-muted-400 mt-1">Este adjunto se incluirá cuando envíes facturas con este producto por correo o WhatsApp.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" size="md" className="flex-1" onClick={closeModal}>Cancelar</Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" loading={isSubmitting}>
            {editing ? 'Guardar' : 'Añadir Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
