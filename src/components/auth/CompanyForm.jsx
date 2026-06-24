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

export default function CompanyForm({ onSubmit: onNext, defaultValues, plan, socialData }) {
  const [logo, setLogo]         = useState(defaultValues?.companyLogo || null)
  const [showPassword, setShowPassword] = useState(false)
  const fileRef                 = useRef()

  const initialValues = { terms: false, ...defaultValues }
  if (socialData) {
    if (socialData.provider === 'Phone') {
      initialValues.phone = socialData.value
    } else {
      initialValues.email = socialData.value
    }
  }

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
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
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-success-500/10 rounded-lg border border-success-500/20 shrink-0">
          <Check size={14} className="text-success-400" />
        </div>
        <div className="space-y-0">
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white">Datos de tu empresa</h2>
          <p className="text-[10px] text-muted-600 dark:text-muted-400">Esta información aparecerá en tus facturas</p>
        </div>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-3 p-2 bg-surface-700/20 rounded-xl border border-subtle">
        <div
          onClick={() => fileRef.current?.click()}
          className={clsx(
            "w-10 h-10 flex items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0",
            logo 
              ? "rounded-full border-0 shadow-none" 
              : "rounded-lg border border-dashed border-subtle bg-surface-700 hover:border-brand-500"
          )}
        >
          {logo
            ? <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            : <Upload size={16} className="text-muted-400" />
          }
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
              {logo ? 'Cambiar logo' : 'Logo de la empresa'} <span className="text-muted-500 font-normal text-[10px]">(opcional)</span>
            </button>
            <p className="text-[10px] text-muted-400 leading-none mt-0.5">PNG, JPG</p>
          </div>
          {logo && (
            <button type="button" onClick={() => setLogo(null)} className="p-1 rounded-lg text-muted-400 hover:text-danger-400 hover:bg-surface-700">
              <X size={13} />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input label="Nombre de la empresa *" icon={<Building2 size={14} />} placeholder="Nombre de tu negocio"
          error={errors.companyName?.message} {...register('companyName')} />
        <Input label="Tu nombre *" icon={<User size={14} />} placeholder="Ej: Juan Pérez"
          error={errors.name?.message} {...register('name')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input 
          label="Correo electrónico *" 
          icon={<Mail size={14} />} 
          placeholder="correo@empresa.com"
          error={errors.email?.message} 
          {...register('email')}
          readOnly={socialData && (socialData.provider === 'Google' || socialData.provider === 'Apple')}
          className={clsx(
            socialData && (socialData.provider === 'Google' || socialData.provider === 'Apple') && "opacity-75 bg-surface-800 pointer-events-none border-success-500/50"
          )}
          iconRight={socialData && (socialData.provider === 'Google' || socialData.provider === 'Apple') && (
            <span className="text-[10px] bg-success-500/20 text-success-400 font-bold px-1.5 py-0.5 rounded border border-success-500/30">✓ {socialData.provider}</span>
          )}
        />
        <Input 
          label="Teléfono *" 
          icon={<Phone size={14} />} 
          placeholder="Ej: +57 300..."
          error={errors.phone?.message} 
          {...register('phone')}
          readOnly={socialData && socialData.provider === 'Phone'}
          className={clsx(
            socialData && socialData.provider === 'Phone' && "opacity-75 bg-surface-800 pointer-events-none border-success-500/50"
          )}
          iconRight={socialData && socialData.provider === 'Phone' && (
            <span className="text-[10px] bg-success-500/20 text-success-400 font-bold px-1.5 py-0.5 rounded border border-success-500/30">✓ Móvil</span>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              className="text-muted-400 hover:text-foreground transition-colors"
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

      <div className="space-y-1.5 pt-0.5 select-none">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input 
            type="checkbox" 
            {...register('terms')} 
            className={clsx(
              "!rounded-full border border-subtle bg-surface-900 cursor-pointer transition-all duration-200",
              errors.terms && "!border-danger-500 !bg-danger-500/10"
            )} 
          />
          <span className="text-[11px] text-muted-600 dark:text-muted-400 group-hover:text-neutral-900 dark:group-hover:text-white leading-relaxed transition-colors font-semibold">
            Acepto los términos y condiciones de uso
          </span>
        </label>
        {errors.terms && (
          <p className="text-[10px] text-danger-400 mt-1">{errors.terms.message}</p>
        )}
      </div>

      <button type="submit"
        className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors mt-0.5">
        {plan === 'standard' ? 'Continuar con el plan gratuito →' : 'Continuar al pago →'}
      </button>
    </form>
  )
}
