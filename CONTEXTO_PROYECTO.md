# Contexto Maestro - GestivaOne

Este archivo es la fuente de contexto del proyecto. Cada funcionalidad, decision de producto o cambio importante debe sumarse aqui de forma breve para que cualquier IA o colaborador entienda el norte sin perder tiempo.

## Identidad

GestivaOne es un SaaS de gestion comercial, operativa y financiera para negocios. Su proposito es ayudar a pequenos comercios, emprendedores y empresas en crecimiento a controlar ventas, inventario, trabajadores, clientes, facturacion, cobros, egresos y reportes desde una sola plataforma en la nube.

Propuesta central: convertir la operacion diaria del negocio en informacion clara para tomar decisiones en tiempo real.

## Valor Aniadido

- Unifica gestion de inventario, ventas, facturacion, cartera, gastos, trabajadores y finanzas en una sola app.
- Reduce la carga operativa de negocios que no tienen equipo contable o sistemas empresariales complejos.
- Permite operar por roles: administrador, despachador y contable.
- Genera reportes financieros y exportaciones PDF/Excel para analisis y control.
- Integra herramientas practicas para Colombia, incluyendo asistente DIAN, reportes de informacion exogena y manejo de IVA/retenciones.
- Maneja alertas preventivas: stock bajo, facturas pendientes, vencimientos y notificaciones.
- Conecta la utilidad del negocio con bolsillos de ahorro y gestion financiera personal.

## Usuario Objetivo

- Tiendas, minimercados, restaurantes, servicios, comercios locales y negocios digitales que necesitan orden operativo.
- Emprendedores que quieren facturar, controlar inventario y saber si ganan o pierden.
- Negocios con trabajadores que requieren permisos diferenciados.
- Empresas pequenas que necesitan reportes sin implementar un ERP pesado.

## Modulos Actuales

- Landing publica: comunica valor, caracteristicas, planes y contacto.
- Autenticacion: registro, inicio de sesion, acceso por trabajador e invitaciones.
- Dashboard: vista general del negocio, ingresos, egresos, utilidad, cartera, clientes y analiticas.
- Menu/Ventas: flujo operativo para vender productos y generar ordenes/facturas.
- Productos/Inventario: gestion de productos, precios, categorias, IVA y stock.
- Clientes: registro, historial y seguimiento de clientes.
- Empleados: gestion de trabajadores, roles e invitaciones temporales.
- Facturero: creacion de facturas, recibos y documentos imprimibles.
- Asistente DIAN: simulaciones y soportes tributarios basados en facturas y egresos.
- Notificaciones: alertas operativas y recordatorios.
- Bolsillos: separacion de dinero por metas, ahorro o reglas de uso.
- Mi Gestion: finanzas personales, retiros desde utilidad, prestamos por cobrar/pagar y gastos personales.
- Configuracion: datos de empresa, impresion, reportes, exportaciones y preferencias.
- Cuenta: perfil, empresa, seguridad y preferencias del usuario.
- Datos y respaldo de cuenta: desde Cuenta permite exportar la informacion de gestion a Excel, importar ese mismo formato y limpiar datos operativos.
- Terminos: politica de privacidad, seguridad y condiciones del servicio.

## Modelo de Negocio

Planes actuales:

- One Standard: gratis, 1 trabajador, facturacion basica, clientes e inventario limitado.
- One Pro: plan mensual para negocios en crecimiento, hasta 10 trabajadores, dashboard avanzado, empleados y reportes PDF/Excel.
- One 360: plan mensual empresarial, hasta 30 trabajadores, multi-sucursal, API personalizada, soporte dedicado y SLA.
- Master Admin: acceso interno total.

La monetizacion se basa en suscripciones con limites por plan y funciones avanzadas.

## Roles y Permisos

- Administrador: acceso completo a dashboard, menu, productos, configuracion, empleados y cuenta.
- Despachador: opera ventas/menu/productos y cuenta; no accede a dashboard, configuracion ni empleados.
- Contable: accede a dashboard y cuenta; no opera menu/productos/configuracion/empleados.

Regla de producto: los roles deben proteger informacion sensible y reducir errores operativos.

## Arquitectura Actual

- Frontend: React 18, Vite, React Router, Tailwind CSS.
- Estado: Zustand con persistencia local.
- Backend/datos: Supabase Auth y tablas de negocio.
- UI: lucide-react, framer-motion, react-hot-toast, recharts.
- Formularios/validacion: react-hook-form, zod.
- Exportacion: jsPDF, jspdf-autotable, xlsx.
- Despliegue previsto: Vercel.

## Datos Principales

Entidades clave detectadas:

- companies: empresa, pais, moneda, logo y settings.
- profiles: usuario, rol, plan, empresa, permisos y sesion activa.
- products: inventario/productos.
- clients: clientes.
- invoices: facturas/ventas/cartera.
- expenses: egresos.
- notifications: alertas.
- personal_loans: prestamos personales.
- pockets: bolsillos o separaciones de dinero.

## Reglas de Producto

- El negocio es el centro; cada dato debe estar asociado a una empresa cuando aplique.
- La app debe priorizar claridad financiera: ingresos, gastos, utilidad, deudas y flujo operativo.
- Toda funcion nueva debe responder a una necesidad real de gestion del negocio.
- Las interfaces deben ser densas pero claras, utiles para trabajo diario, no solo visuales.
- Cualquier exportacion debe ser entendible para el dueno del negocio o su contador.
- El producto debe funcionar para usuarios sin experiencia tecnica ni financiera profunda.

## Diferenciadores a Preservar

- Gestion integral sin complejidad de ERP.
- Finanzas del negocio conectadas con finanzas personales.
- Enfoque localizable para Colombia y obligaciones DIAN.
- Roles simples y practicos para equipos pequenos.
- Reportes y documentos listos para imprimir/exportar.
- Experiencia moderna, sobria y confiable.

## Criterios Para Nuevas Funciones

Antes de agregar algo, validar:

- Ayuda a vender, cobrar, controlar inventario, gestionar equipo o entender finanzas.
- Reduce pasos manuales o evita errores.
- Respeta roles, empresa activa y plan del usuario.
- Puede medirse en dashboard, reporte o historial.
- No introduce complejidad innecesaria para comercios pequenos.

## Estado Tecnico Importante

- La app limpia cache/localStorage por version para evitar estados viejos incompatibles.
- Standard limita sesiones activas mediante active_session_id.
- Trabajadores pueden vincularse por codigo de invitacion, idealmente via RPC `use_invitation_code`.
- Supabase es la fuente principal de autenticacion y datos.
- Algunos datos tienen fallback local para resiliencia o modo parcial.
- La gestion de datos de cuenta vive en `src/services/accountDataService.js`: respalda productos, clientes, egresos, facturas, abonos, notificaciones, bolsillos/settings y prestamos personales en un Excel multi-hoja; tambien importa el mismo formato y puede limpiar datos de gestion sin borrar usuario ni empresa.

## Pendientes / Horizonte

- Consolidar README tecnico y guia de instalacion.
- Normalizar textos con codificacion UTF-8 si aparecen caracteres corruptos.
- Confirmar esquema completo de Supabase y documentar tablas/campos.
- Revisar que limites de planes se apliquen de forma consistente en UI y datos.
- Fortalecer flujos de invitacion de trabajadores con backend/Edge Functions si es necesario.
- Mantener este archivo actualizado en cada cambio de producto o arquitectura.

## Regla de Mantenimiento Para IA

Cuando una IA agregue o modifique funcionalidades relevantes, debe actualizar este archivo con:

- Que se agrego.
- Que problema resuelve.
- Que modulo afecta.
- Si cambia roles, planes, datos, reportes o reglas del negocio.

Mantenerlo breve. No convertirlo en changelog tecnico extenso.
