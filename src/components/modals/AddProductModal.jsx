import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Tag, DollarSign, Archive } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useProductStore, CATEGORIES } from '@/store/useProductStore'
import { useUIStore } from '@/store/useUIStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  price:    z.coerce.number().positive('Precio inválido'),
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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'UND', stock: 0, category: 'Otros' },
  })

  const unit = watch('unit')

  useEffect(() => {
    if (open && editing) reset({ ...editing, stock: editing.stock ?? 0 })
    else if (open) reset({ unit: 'UND', stock: 0, category: 'Otros', name: '', price: '' })
  }, [open, editing])

  const onSubmit = async (data) => {
    if (editing) {
      await updateProduct(editing.id, data)
      toast.success('Producto actualizado')
    } else {
      await addProduct(data)
      toast.success(`${data.name} añadido`)
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
            label="Precio (USD) *"
            icon={<DollarSign size={14} />}
            error={errors.price?.message}
            placeholder="0.00"
            type="number"
            step="0.01"
            {...register('price')}
          />
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
                    ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                    : 'border-subtle bg-surface-700 text-muted-400 hover:text-white'
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
            className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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
