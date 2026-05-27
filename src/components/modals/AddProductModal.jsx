import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Tag, DollarSign, Archive } from 'lucide-react'
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
})

const UNITS = ['KG', 'LB', 'UND', 'L', 'M']

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
    defaultValues: { unit: 'UND', stock: 0, category: 'Otros', cost: 0 },
  })

  const unit = watch('unit')
  const selectedCategory = watch('category')

  useEffect(() => {
    if (open && editing) {
      reset({ ...editing, stock: editing.stock ?? 0, cost: editing.cost ?? 0 })
      setCustomCategoryName('')
    }
    else if (open) {
      reset({ unit: 'UND', stock: 0, category: 'Otros', name: '', price: '', cost: 0 })
      setCustomCategoryName('')
    }
  }, [open, editing])

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

    const finalData = { ...data, category: finalCategory }

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
          <Input
            label="Stock disponible"
            icon={<Archive size={14} />}
            placeholder="0"
            type="number"
            {...register('stock')}
          />
        </div>

        {/* Unit selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-500 uppercase tracking-wide">Unidad</span>
          <div className="flex gap-2">
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
                {u}
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
