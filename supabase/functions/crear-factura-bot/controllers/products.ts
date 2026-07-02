import { Context } from "https://esm.sh/hono@3.11.10"
import { supabase } from "../utils/supabase.ts"

// GET /api/products - Consultar productos/inventario
export async function getProducts(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")
  const searchQuery = c.req.query("search")
  const limitQuery = c.req.query("limit")
  const limit = limitQuery ? Number(limitQuery) : 15

  if (isDemo) {
    const demoProducts = [
      { id: "demo-prod-1", name: "Producto Demo A", price: 15000, stock: 50, unit: "UND" },
      { id: "demo-prod-2", name: "Producto Demo B", price: 35000, stock: 8, unit: "UND" },
      { id: "demo-prod-3", name: "Servicio de Soporte Demo", price: 120000, stock: 999, unit: "UND" }
    ]
    if (searchQuery) {
      const filtered = demoProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return c.json(filtered.slice(0, limit))
    }
    return c.json(demoProducts.slice(0, limit))
  }

  let queryBuilder = supabase
    .from("products")
    .select("id, name, price, cost, category, unit, stock")
    .eq("company_id", companyId)

  if (searchQuery) {
    queryBuilder = queryBuilder.ilike("name", `%${searchQuery}%`)
  }

  const { data, error } = await queryBuilder
    .order("name", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("Error al consultar productos:", error)
    return c.json({ error: "No se pudieron consultar los productos en la base de datos." }, 500)
  }

  return c.json(data)
}
