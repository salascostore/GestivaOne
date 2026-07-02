import { createClient } from "jsr:@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

export const isDemoMode = !supabaseUrl || 
                          supabaseUrl.includes("your-project-name") || 
                          !supabaseServiceKey

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
