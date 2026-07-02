import { Context } from "https://esm.sh/hono@3.11.10"
import { supabase } from "../utils/supabase.ts"

// GET /api/clients - Listar clientes
export async function getClients(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")
  const searchQuery = c.req.query("search")

  if (isDemo) {
    const demoClients = [
      { id: "demo-client-uuid-1", name: "Juan Pérez (Demo)", email: "juan@example.com" },
      { id: "demo-client-uuid-2", name: "María Gómez (Demo)", email: "maria@example.com" }
    ]
    if (searchQuery) {
      const filtered = demoClients.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return c.json(filtered)
    }
    return c.json(demoClients)
  }

  let queryBuilder = supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)

  if (searchQuery) {
    queryBuilder = queryBuilder.ilike("name", `%${searchQuery}%`)
  }

  const { data, error } = await queryBuilder.order("name", { ascending: true })

  if (error) {
    console.error("Error al listar clientes:", error)
    return c.json({ error: "No se pudieron consultar los clientes en la base de datos." }, 500)
  }

  return c.json(data)
}

// POST /api/clients - Crear cliente
export async function createClient(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Cuerpo JSON inválido" }, 400)
  }

  const { 
    client_name, 
    client_email, 
    client_phone, 
    client_address, 
    client_document 
  } = body

  if (!client_name) {
    return c.json({ error: "Falta el campo requerido: client_name" }, 400)
  }

  if (isDemo) {
    return c.json({
      success: true,
      demo: true,
      client_id: "demo-client-uuid",
      client_name,
      message: `Cliente ${client_name} registrado con éxito en GestivaOne (Modo Demo).`
    })
  }

  const { data: newClient, error: clientCreateError } = await supabase
    .from("clients")
    .insert([{
      company_id: companyId,
      name: client_name,
      email: client_email || null,
      phone: client_phone || null,
      address: client_address || null,
      document_id: client_document || null
    }])
    .select("id")
    .single()

  if (clientCreateError || !newClient) {
    console.error("Error al crear cliente:", clientCreateError)
    return c.json({ 
      error: "No se pudo registrar el cliente en la base de datos.",
      details: clientCreateError?.message || "Error desconocido",
      hint: clientCreateError?.hint || ""
    }, 500)
  }

  return c.json({
    success: true,
    demo: false,
    client_id: newClient.id,
    client_name,
    message: `Cliente ${client_name} registrado con éxito en GestivaOne.`
  })
}
