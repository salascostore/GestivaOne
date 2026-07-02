// supabase/functions/crear-factura-bot/index.ts
// Edge Function para GestiBot - Refactorizado con Hono y endpoints RESTful

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Hono } from "https://esm.sh/hono@3.11.10"
import { cors } from "https://esm.sh/hono@3.11.10/cors"
import { authMiddleware } from "./middleware/auth.ts"
import { getClients, createClient } from "./controllers/clients.ts"
import { generateInvoice, getInvoicePDF } from "./controllers/invoices.ts"
import { getDashboardReport, getDebtsReport, getDailySummary } from "./controllers/reports.ts"
import { validateOTP, createWorker } from "./controllers/auth.ts"
import { createExpense } from "./controllers/expenses.ts"
import { getProducts } from "./controllers/products.ts"

const app = new Hono()

// Habilitar CORS globalmente con los headers requeridos
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["authorization", "x-client-info", "apikey", "content-type", "x-api-key", "x-user-phone"],
    exposeHeaders: ["content-length"],
    maxAge: 600,
  })
)

// Aplicar middleware de autenticación a todas las rutas bajo /api/*
app.use("/api/*", authMiddleware)

// Endpoints REST
app.get("/api/clients", getClients)
app.post("/api/clients", createClient)
app.post("/api/invoices/generate", generateInvoice)
app.get("/api/invoices/:id/pdf", getInvoicePDF)
app.get("/api/reports/dashboard", getDashboardReport)
app.get("/api/reports/debts", getDebtsReport)
app.get("/api/reports/daily", getDailySummary)
app.post("/api/expenses", createExpense)
app.get("/api/products", getProducts)
app.post("/api/workers", createWorker)

// Endpoint de compatibilidad para validación de OTP/GestiToken
app.post("/api/auth/validate-otp", validateOTP)

Deno.serve((req) => {
  const url = new URL(req.url)
  // Eliminar prefijos de Supabase para soportar enrutamiento Hono
  if (url.pathname.startsWith("/functions/v1/crear-factura-bot")) {
    url.pathname = url.pathname.replace("/functions/v1/crear-factura-bot", "")
  } else if (url.pathname.startsWith("/crear-factura-bot")) {
    url.pathname = url.pathname.replace("/crear-factura-bot", "")
  }
  return app.fetch(new Request(url.toString(), req))
})

