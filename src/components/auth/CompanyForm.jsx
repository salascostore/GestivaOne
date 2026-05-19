import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, User, Mail, Phone, Upload, X, Check, Eye, EyeOff } from 'lucide-react'
import Input from '@/components/ui/Input'
import clsx from 'clsx'

const schema = z.object({
  companyName: z.string().min(2, 'Mínimo 2 caracteres'),
  name:        z.string().min(2, 'Mínimo 2 caracteres'),
  email:       z.string().email('Correo inválido'),
  phone:       z.string().min(7, 'Teléfono inválido'),
  password:    z.string().min(6, 'Mínimo 6 caracteres'),
  repeatPassword: z.string(),
  terms:       z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos' }) }),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Las contraseñas no coinciden",
  path: ["repeatPassword"],
})

export default function CompanyForm({ onSubmit: onNext, defaultValues, plan }) {
  const [logo, setLogo]         = useState(defaultValues?.companyLogo || null)
  const [showPassword, setShowPassword] = useState(false)
  const fileRef                 = useRef()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { terms: false, ...defaultValues },
  })

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(ev.target.result)
    reader.readAsDataURL(file)
  }

  const submit = (data) => onNext({ ...data, companyLogo: logo })

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-success-500/10 rounded-xl border border-success-500/20 shrink-0">
          <Check size={18} className="text-success-400" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-white">Datos de tu empresa</h2>
          <p className="text-[11px] text-muted-400">Esta información aparecerá en tus facturas</p>
        </div>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-3 p-3 bg-surface-700/30 rounded-2xl border border-subtle">
        <div
          onClick={() => fileRef.current?.click()}
          className={clsx(
            "w-12 h-12 flex items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0",
            logo 
              ? "rounded-full border-0 shadow-none" 
              : "rounded-xl border-2 border-dashed border-subtle bg-surface-700 hover:border-brand-500"
          )}
        >
          {logo
            ? <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            : <Upload size={20} className="text-muted-400" />
          }
        </div>
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-brand-400 hover:text-brand-300 font-medium">
            {logo ? 'Cambiar logo' : 'Subir logo empresa'} <span className="text-muted-500 font-normal">(opcional)</span>
          </button>
          {logo && (
            <button type="button" onClick={() => setLogo(null)} className="ml-2 text-muted-400 hover:text-danger-400">
              <X size={13} />
            </button>
          )}
          <p className="text-[11px] text-muted-400 mt-0.5">PNG, JPG. Aparecerá en el sidebar.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Nombre de la empresa *" icon={<Building2 size={14} />} placeholder="Nombre de tu negocio"
          error={errors.companyName?.message} {...register('companyName')} />
        <Input label="Tu nombre *" icon={<User size={14} />} placeholder="Ej: Juan Pérez"
          error={errors.name?.message} {...register('name')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Correo electrónico *" icon={<Mail size={14} />} placeholder="correo@empresa.com"
          error={errors.email?.message} {...register('email')} />
        <Input label="Teléfono *" icon={<Phone size={14} />} placeholder="Ej: +57 300..."
          error={errors.phone?.message} {...register('phone')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input 
          label="Contraseña *" 
          type={showPassword ? "text" : "password"} 
          icon={<User size={14} />} 
          placeholder="Establecer contraseña"
          error={errors.password?.message} 
          {...register('password')} 
          iconRight={
            <button 
              type="button"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
              className="text-muted-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Input 
          label="Repetir contraseña *" 
          type={showPassword ? "text" : "password"} 
          icon={<User size={14} />} 
          placeholder="Confirmar contraseña"
          error={errors.repeatPassword?.message} 
          {...register('repeatPassword')} 
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-1.5 pt-0.5">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input type="checkbox" {...register('terms')} className="peer hidden" />
          <div className={clsx(
            'w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200',
            'border-surface-400 group-hover:border-brand-500',
            'peer-checked:border-brand-500 peer-checked:bg-brand-600/20',
            errors.terms && 'border-danger-400'
          )}>
            <Check size={8} className="text-brand-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <span className="text-[11px] text-muted-400 group-hover:text-white leading-relaxed transition-colors">
            Acepto los términos y condiciones de uso
          </span>
        </label>
        {errors.terms && (
          <p className="text-[10px] text-danger-400 mt-1">{errors.terms.message}</p>
        )}
      </div>

      <button type="submit"
        className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors mt-1">
        {plan === 'standard' ? 'Continuar con el plan gratuito →' : 'Continuar al pago →'}
      </button>
    </form>
  )
}
