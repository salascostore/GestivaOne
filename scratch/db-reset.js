import { supabase } from '../src/lib/supabase.js'

async function clearAndSetup() {
  console.log('--- Iniciando limpieza de base de datos ---')

  const tables = ['invoices', 'clients', 'products', 'profiles', 'companies']

  for (const table of tables) {
    console.log(`Vaciando tabla: ${table}...`)
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.error(`Error vaciando ${table}:`, error.message)
  }

  console.log('--- Limpieza completada ---')
  console.log('Nota: Para los usuarios de Auth, debes borrarlos manualmente en el panel de Supabase si deseas resetear el Auth por completo.')
  process.exit(0)
}

clearAndSetup()
