import { Context } from "https://esm.sh/hono@3.11.10"
import { supabase } from "../utils/supabase.ts"

// POST /api/expenses - Registrar un gasto/egreso
export async function createExpense(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Cuerpo JSON inválido" }, 400)
  }

  const { amount, category, description, provider_name } = body

  if (!amount || !category) {
    return c.json({ error: "Faltan campos requeridos: amount, category" }, 400)
  }

  if (isDemo) {
    return c.json({
      success: true,
      demo: true,
      expense_id: "demo-expense-uuid",
      amount,
      category,
      message: `Gasto por valor de $${Number(amount).toLocaleString('es-CO')} COP registrado con éxito en la categoría ${category} (Modo Demo).`
    })
  }

  const { data: newExpense, error: expenseError } = await supabase
    .from("expenses")
    .insert([{
      company_id: companyId,
      amount,
      category,
      description: description || null,
      provider_name: provider_name || 'Proveedor Varios'
    }])
    .select("id")
    .single()

  if (expenseError || !newExpense) {
    console.error("Error al crear gasto:", expenseError)
    return c.json({ error: "No se pudo registrar el gasto en la base de datos de Supabase.", details: expenseError?.message }, 500)
  }

  return c.json({
    success: true,
    demo: false,
    expense_id: newExpense.id,
    amount,
    category,
    message: `Gasto por valor de $${Number(amount).toLocaleString('es-CO')} COP registrado con éxito en la categoría ${category}.`
  })
}
