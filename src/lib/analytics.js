import { supabase } from '@/lib/supabase'

/**
 * Registra eventos de negocio en la tabla `events`.
 * @param {Object} params
 * @param {string} params.event - Nombre del evento (ej: 'user_signup', 'payment_completed')
 * @param {string} [params.user_id] - ID del usuario (opcional si es un visitante)
 * @param {Object} [params.metadata] - JSON con propiedades adicionales.
 */
export const trackEvent = async ({ event, user_id = null, metadata = {} }) => {
  try {
    if (!event || event.length > 50) return
    if (JSON.stringify(metadata).length > 2048) return

    // Fire & Forget: Inserta en Supabase y no bloquea
    // NOTA: Para que funcione sin RLS errors, asegúrate de que la tabla `events` tenga 
    // políticas (Policies) que permitan INSERT a usuarios autenticados (y anónimos si es necesario).
    supabase.from('events').insert([{ event, user_id, metadata }]).then(({ error }) => {
      if (error) console.error('Error tracking event:', error)
    })
  } catch (error) {
    // Silencioso
  }
}
