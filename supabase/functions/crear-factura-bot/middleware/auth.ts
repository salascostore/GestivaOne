import { Context, Next } from "https://esm.sh/hono@3.11.10"
import { supabase, isDemoMode } from "../utils/supabase.ts"

// Generador de Hash SHA-256 determinista
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function authMiddleware(c: Context, next: Next) {
  if (isDemoMode) {
    c.set("company_id", "demo-company-id")
    c.set("company_name", "Mi Empresa (Modo Demo)")
    c.set("is_demo", true)
    return await next()
  }

  const apiKeyHeader = c.req.header("x-api-key")

  if (apiKeyHeader) {
    // 1. Autenticación por API Key
    const keyHash = await sha256(apiKeyHeader.trim())
    const { data: apiKeyRecord, error } = await supabase
      .from("api_keys")
      .select("company_id")
      .eq("key_hash", keyHash)
      .eq("activo", true)
      .single()

    if (error || !apiKeyRecord) {
      return c.json({ error: "API Key inválida o inactiva" }, 401)
    }

    // Obtener información de la empresa
    const { data: dbCompany } = await supabase
      .from("companies")
      .select("name")
      .eq("id", apiKeyRecord.company_id)
      .single()

    c.set("company_id", apiKeyRecord.company_id)
    c.set("company_name", dbCompany?.name || "Empresa Registrada")
    c.set("is_demo", false)
    c.set("auth_method", "api_key")
    return await next()
  }

  // 2. Autenticación por Teléfono + Sesión OTP (Soporte Dual)
  let userPhone = c.req.query("user_phone") || c.req.header("x-user-phone")

  if (!userPhone) {
    // Intentar leer desde el body JSON si es una petición POST/PUT
    try {
      const contentType = c.req.header("content-type") || ""
      if (contentType.includes("application/json")) {
        const body = await c.req.raw.clone().json()
        userPhone = body?.user_phone
      }
    } catch (_) {
      // Ignorar error si no hay JSON
    }
  }

  if (!userPhone) {
    return c.json({ error: "Falta credencial de autenticación: x-api-key o user_phone requerido" }, 401)
  }

  const cleanPhone = userPhone.split("@")[0].replace(/\D/g, "")

  // Buscar el perfil del usuario de WhatsApp para obtener su company_id
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("company_id")
    .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone.slice(-10)}`)
    .limit(1)

  if (profError || !profiles || profiles.length === 0) {
    return c.json(
      { error: `No se encontró ninguna cuenta de GestivaOne vinculada al número ${cleanPhone}.` },
      404
    )
  }

  const companyId = profiles[0].company_id

  // Obtener información de la empresa
  const { data: dbCompany } = await supabase
    .from("companies")
    .select("name, settings")
    .eq("id", companyId)
    .single()

  if (!dbCompany) {
    return c.json({ error: "No se encontró información de la empresa vinculada." }, 404)
  }

  const settings = dbCompany.settings || {}

  // Si la seguridad OTP está habilitada, validar si la sesión del teléfono actual está activa (excepto en la ruta de validación)
  const isValidateOtpRoute = c.req.path.endsWith("/auth/validate-otp")
  if (settings.gestibot_otp_enabled && !isValidateOtpRoute) {
    const sessions = settings.gestibot_sessions || {}
    const expiry = sessions[cleanPhone]
    const isSessionActive = expiry && new Date(expiry) > new Date()

    if (!isSessionActive) {
      return c.json({
        success: false,
        security_blocked: true,
        message: "Por motivos de seguridad, su sesión de consulta en WhatsApp ha expirado o está inactiva. Por favor, genere un código de 6 dígitos en el panel de GestivaOne (sección GestiToken) y escríbalo aquí para autorizar el acceso."
      }, 200) // Devolver 200 para que n8n maneje la seguridad sin arrojar un error HTTP
    }
  }

  c.set("company_id", companyId)
  c.set("company_name", dbCompany.name)
  c.set("company_settings", settings)
  c.set("user_phone", cleanPhone)
  c.set("is_demo", false)
  c.set("auth_method", "otp_session")

  return await next()
}
