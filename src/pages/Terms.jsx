import { motion } from 'framer-motion'
import { Shield, Lock, FileText, ChevronRight, Eye, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
}

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-950 text-foreground py-10 px-4 md:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Floating Back Button */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/80 hover:bg-surface-700/80 border border-subtle transition-all duration-300 text-sm font-bold shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-black text-brand-400">
            <Shield size={12} />
            <span>Privacidad Garantizada</span>
          </div>
        </motion.div>

        {/* Hero Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center mx-auto shadow-glow-sm">
            <FileText size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Términos, Condiciones y Privacidad</h1>
          <p className="text-sm md:text-base text-muted-400 max-w-xl mx-auto leading-relaxed">
            Tu confianza es nuestro recurso más valioso. Aquí detallamos con total transparencia cómo protegemos tu información y potenciamos tu negocio.
          </p>
        </motion.div>

        {/* Content sections with Liquid Glass effect */}
        <motion.div variants={itemVariants} className="liquid-glass p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-subtle">
            <Lock className="text-brand-500 shrink-0" size={24} />
            <h2 className="text-lg md:text-xl font-bold">1. Tratamiento de Datos Personales</h2>
          </div>
          <p className="text-xs md:text-sm text-muted-400 leading-relaxed">
            En <strong>GestivaOne</strong>, recopilamos únicamente la información necesaria para brindarte una gestión de facturación impecable. Esto incluye tu nombre comercial, correo de contacto, datos operativos de productos y transacciones de facturación express.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-surface-900/50 border border-subtle space-y-2">
              <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                Seguridad Cifrada
              </h3>
              <p className="text-[11px] text-muted-400 leading-relaxed">
                Toda la comunicación de datos transita sobre túneles cifrados SSL/TLS hacia nuestros servidores seguros en Supabase.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-900/50 border border-subtle space-y-2">
              <h3 className="text-xs font-black text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                Cero Venta de Datos
              </h3>
              <p className="text-[11px] text-muted-400 leading-relaxed">
                Jamás comercializamos tus datos comerciales ni los compartimos con terceras empresas para campañas publicitarias.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="liquid-glass p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-subtle">
            <Shield className="text-brand-500 shrink-0" size={24} />
            <h2 className="text-lg md:text-xl font-bold">2. Límites de Privacidad que Brindamos</h2>
          </div>
          <p className="text-xs md:text-sm text-muted-400 leading-relaxed">
            Te otorgamos el control absoluto de tus operaciones financieras y de tu equipo de trabajo. Nuestros estrictos límites garantizan lo siguiente:
          </p>
          <ul className="space-y-3.5">
            {[
              "Aislamiento de Empresa: Nadie fuera de los trabajadores vinculados mediante tu código exclusivo puede ver tus productos, facturas o métricas.",
              "Roles Jerárquicos Estrictos: Tú como dueño controlas en tiempo real qué empleados tienen permisos de edición y quiénes solo de despacho.",
              "Derecho al Olvido: Puedes eliminar tus bases de datos o cuentas de empleados en cualquier momento desde tu panel de configuración de forma inmediata.",
              "Vencimiento de Enlaces: Los códigos temporales que generas para tus trabajadores vencen automáticamente para evitar intrusiones no deseadas."
            ].map((text, idx) => (
              <li key={idx} className="flex gap-3 text-xs md:text-sm text-muted-400 leading-relaxed">
                <ChevronRight size={16} className="text-brand-500 shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={itemVariants} className="liquid-glass p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-subtle">
            <Eye className="text-brand-500 shrink-0" size={24} />
            <h2 className="text-lg md:text-xl font-bold">3. Uso de Cookies Operativas</h2>
          </div>
          <p className="text-xs md:text-sm text-muted-400 leading-relaxed">
            Utilizamos tecnologías de almacenamiento local y cookies operativas con el único propósito de recordar tu tema visual (claro/oscuro), mantener tu sesión iniciada de manera segura y agilizar las cargas de inventario local. Ninguna cookie rastrea tu comportamiento en otras plataformas.
          </p>
        </motion.div>

        {/* Footer Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4 pt-4">
          <div className="flex justify-center items-center gap-2 text-xs font-bold text-muted-500">
            <Shield size={14} className="text-brand-500" />
            <span>Comprometidos con tu seguridad · GestivaOne 2026</span>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="px-8 shadow-glow-sm"
          >
            Entendido, volver al inicio
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
