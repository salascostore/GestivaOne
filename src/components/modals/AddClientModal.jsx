import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, MapPin, Phone, Mail, UserCheck, Zap } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useClientStore } from '@/store/useClientStore'
import { useUIStore } from '@/store/useUIStore'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const schema = z.object({
  name:    z.string().min(2, 'Mínimo 2 caracteres'),
  address: z.string().optional(),
  phone:   z.string().optional(),
  email:   z.string().email('Correo inválido').optional().or(z.literal('')),
  type:    z.enum(['frequent', 'express']),
})

export default function AddClientModal({ open }) {
  const addClient   = useClientStore((s) => s.addClient)
  const selectClient = useClientStore((s) => s.selectClient)
  const closeModal  = useUIStore((s) => s.closeModal)
  const editingClient = useUIStore((s) => s.editingClient)
  const updateClient = useClientStore((s) => s.updateClient)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'frequent', name: '', address: '', phone: '', email: '' },
  })

  const clientType = watch('type')

  useEffect(() => {
    if (open && editingClient) {
      reset({ ...editingClient })
    } else if (open) {
      reset({ type: 'frequent', name: '', address: '', phone: '', email: '' })
    }
  }, [open, editingClient])

  const onSubmit = async (data) => {
    if (editingClient) {
      await updateClient(editingClient.id, data)
      toast.success('Cliente actualizado')
    } else {
      const client = await addClient(data)
      if (client) {
        selectClient(client.id)
        toast.success(`${data.name} añadido y seleccionado`)
      }
    }
    closeModal()
  }

  const TypeBtn = ({ value, label, icon: Icon, desc }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => setValue('type', value)}
      className={clsx(
        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
        clientType === value
          ? 'border-brand-500 bg-brand-600/15'
          : 'border-subtle bg-surface-700 hover:border-surface-300'
      )}
    >
      <div className={clsx('p-2 rounded-lg', clientType === value ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-500 text-muted-400')}>
        <Icon size={18} />
      </div>
      <span className={clsx('text-sm font-semibold', clientType === value ? 'text-white' : 'text-muted-400')}>{label}</span>
      <span className="text-[11px] text-muted-400 leading-tight">{desc}</span>
    </motion.button>
  )

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Client type */}
        {!editingClient && (
          <div className="flex gap-3">
            <TypeBtn value="frequent" label="Frecuente" icon={UserCheck} desc="Historial & seguimiento" />
            <TypeBtn value="express"  label="Express"   icon={Zap}       desc="Venta rápida, temporal" />
          </div>
        )}

        <Input
          label="Nombre *"
          icon={<User size={14} />}
          error={errors.name?.message}
          placeholder="Nombre del cliente"
          {...register('name')}
        />

        {clientType === 'frequent' && (
          <>
            <Input
              label="Dirección"
              icon={<MapPin size={14} />}
              placeholder="Dirección de entrega (opcional)"
              {...register('address')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Teléfono"
                icon={<Phone size={14} />}
                placeholder="Ej: +57 300..."
                {...register('phone')}
              />
              <Input
                label="Correo electrónico"
                icon={<Mail size={14} />}
                placeholder="correo@cliente.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" size="md" className="flex-1" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" className="flex-1" loading={isSubmitting}>
            {editingClient ? 'Guardar Cambios' : 'Añadir Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
