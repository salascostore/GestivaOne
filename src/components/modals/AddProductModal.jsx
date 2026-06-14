import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Tag, DollarSign, Archive, Link2, FileUp } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useProductStore, CATEGORIES } from '@/store/useProductStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  price:    z.coerce.number().positive('Precio inválido'),
  cost:     z.coerce.number().min(0, 'Costo inválido').optional().or(z.literal('')),
  unit:     z.enum(['KG', 'LB', 'UND', 'L', 'M']),
  category: z.string().optional(),
  stock:    z.coerce.number().min(0).optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
})

const UNITS = ['KG', 'LB', 'UND', 'L', 'M']
const UNIT_LABELS = { }

export default function AddProductModal({ open }) {
  const addProduct    = useProductStore((s) => s.addProduct)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const closeModal    = useUIStore((s) => s.closeModal)
  const editing       = useUIStore((s) => s.editingProduct)
  const baseCurrency  = useCurrencyStore((s) => s.baseCurrency)

  const userSettings = useAuthStore((s) => s.user?.settings)
  const customCats = userSettings?.custom_categories || []
  const dynamicCategories = [...CATEGORIES.filter(c => c !== 'Otros'), ...customCats, 'Otros']

  const [customCategoryName, setCustomCategoryName] = useState('')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'UND', stock: 0, category: 'Otros', cost: 0, attachment_url: '', attachment_name: '' },
  })

  const unit = watch('unit')
  const selectedCategory = watch('category')
  
  // Derived state for unlimited
  const [isUnlimited, setIsUnlimited] = useState(false)

  useEffect(() => {
    if (open && editing) {
      const isEditingUnlimited = editing.unit === 'ILIMITADO' || editing.stock >= 999999999
      setIsUnlimited(isEditingUnlimited)
      reset({ 
        ...editing, 
        unit: editing.unit === 'ILIMITADO' ? 'UND' : editing.unit,
        stock: isEditingUnlimited ? 0 : (editing.stock ?? 0), 
        cost: editing.cost ?? 0, 
        attachment_url: editing.attachment_url ?? '', 
        attachment_name: editing.attachment_name ?? '' 
      })
      setCustomCategoryName('')
    }
    else if (open) {
      setIsUnlimited(false)
      reset({ unit: 'UND', stock: 0, category: 'Otros', name: '', price: '', cost: 0, attachment_url: '', attachment_name: '' })
      setCustomCategoryName('')
    }
  }, [open, editing, reset])

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
    }

    if (editing) {
      await updateProduct(editing.id, finalData)
      toast.success('Producto actualizado')
    } else {
      await addProduct(finalData)
      toast.success(`${finalData.name} añadido`)
    }
    closeModal()
  }

  return (
    <Modal open={open} onClose={closeModal} title={editing ? 'Editar Producto' : 'Nuevo Producto'} size="md">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Stock disponible</label>
            <button
              type="button"
              onClick={() => {
                setIsUnlimited(!isUnlimited)
                if (!isUnlimited) setValue('stock', 0)
              }}
              className={clsx(
                'text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
                isUnlimited ? 'bg-success-500/20 text-success-400' : 'bg-surface-700 text-muted-400 hover:text-foreground'
              )}
            >
              Ilimitado
            </button>
          </div>
          <Input
            icon={<Archive size={14} />}
            placeholder="0"
            type="number"
            disabled={isUnlimited}
            {...register('stock')}
          />
          {isUnlimited && (
            <p className="text-[11px] text-muted-400 mt-1.5">Este producto no descuenta inventario al venderse.</p>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<FileUp size={14} />}
              className="w-full opacity-50 cursor-not-allowed"
              title="Próximamente: Subir archivo directamente"
              onClick={(e) => {
                e.preventDefault()
                toast('La subida de archivos estará disponible próximamente. Por favor usa un enlace por ahora.', { icon: 'ℹ️' })
              }}
            >
              Subir Archivo (Próximamente)
            </Button>
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
