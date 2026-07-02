import { Context } from "https://esm.sh/hono@3.11.10"
import { supabase } from "../utils/supabase.ts"

// Función para verificar GestiToken (OTP) determinista
function verifyOTP(companyId: string, inputCode: string): boolean {
  const cleanInput = inputCode.replace(/\s/g, "")
  const epochMin = Math.floor(Date.now() / 60000)
  
  const calcOTP = (min: number) => {
    let compHash = 0
    if (companyId) {
      for (let i = 0; i < companyId.length; i++) {
        compHash += companyId.charCodeAt(i)
      }
    }
    let seed = min * 1234567 + compHash * 98765 + 987654321
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const otp = 100000 + (seed % 900000)
    return otp.toString()
  }

  // Tolerancia de 1 minuto hacia atrás
  return calcOTP(epochMin) === cleanInput || calcOTP(epochMin - 1) === cleanInput
}

// POST /api/auth/validate-otp - Validar GestiToken (OTP) e iniciar sesión
export async function validateOTP(c: Context) {
  const companyId = c.get("company_id")
  const userPhone = c.get("user_phone")
  const settings = c.get("company_settings") || {}
  const isDemo = c.get("is_demo")

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Cuerpo JSON inválido" }, 400)
  }

  const { otp_code } = body

  if (!otp_code) {
    return c.json({ error: "Falta el campo requerido: otp_code" }, 400)
  }

  if (isDemo) {
    const isValid = /^\d{6}$/.test(otp_code.replace(/\s/g, ""))
    if (isValid) {
      return c.json({
        success: true,
        message: "GestiToken verificado con éxito, patrón (Modo Demo). Su sesión en WhatsApp ha sido autorizada por 1 hora."
      })
    } else {
      return c.json({ error: "El GestiToken ingresado no es válido. Debe tener 6 dígitos." }, 400)
    }
  }

  const isValid = verifyOTP(companyId, otp_code)
  if (!isValid) {
    return c.json({ error: "El GestiToken es incorrecto o ya expiró. Por favor consulte el código actual en el panel de GestivaOne." }, 400)
  }

  // Registrar sesión activa en settings de la empresa
  const sessions = settings.gestibot_sessions || {}
  const duration = settings.gestibot_otp_duration || 3600000 // default 1h

  sessions[userPhone] = new Date(Date.now() + duration).toISOString()

  const updatedSettings = {
    ...settings,
    gestibot_sessions: sessions
  }

  const { error: updateError } = await supabase
    .from("companies")
    .update({ settings: updatedSettings })
    .eq("id", companyId)

  if (updateError) {
    console.error("Error al actualizar sesiones de GestiBot:", updateError)
    return c.json({ error: "No se pudo actualizar la sesión autorizada en la base de datos." }, 500)
  }

  const durationMin = Math.round(duration / 60000)
  return c.json({
    success: true,
    message: `Código verificado con éxito, patrón. Su sesión ha sido iniciada. El bot estará desbloqueado durante los próximos ${durationMin} minutos para sus consultas.`
  })
}

// POST /api/workers - Registrar nuevo trabajador
export async function createWorker(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Cuerpo JSON inválido" }, 400)
  }

  const { 
    worker_name, 
    worker_email, 
    worker_role = "despachador", 
    worker_phone 
  } = body

  if (!worker_name || !worker_email) {
    return c.json({ error: "Faltan campos requeridos: worker_name, worker_email" }, 400)
  }

  if (isDemo) {
    return c.json({
      success: true,
      demo: true,
      worker_id: "demo-worker-uuid",
      worker_name,
      message: `Trabajador ${worker_name} registrado con éxito con el rol de ${worker_role} (Modo Demo).`
    })
  }

  const { data: newWorker, error: workerCreateError } = await supabase
    .from("profiles")
    .insert([{
      id: crypto.randomUUID(),
      company_id: companyId,
      full_name: worker_name,
      email: worker_email,
      role: worker_role,
      phone: worker_phone || ""
    }])
    .select("id")
    .single()

  if (workerCreateError || !newWorker) {
    console.error("Error al crear trabajador:", workerCreateError)
    return c.json({ error: "No se pudo registrar el trabajador en la base de datos." }, 500)
  }

  return c.json({
    success: true,
    demo: false,
    worker_id: newWorker.id,
    worker_name,
    message: `Trabajador ${worker_name} registrado con éxito con el rol de ${worker_role}.`
  })
}
