-- MIGRACIÓN SUPABASE: CRM ACTVIDADES
-- Ejecuta este script en el editor SQL de tu panel de Supabase para habilitar la persistencia en la nube del CRM.

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  client_id UUID NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
DROP POLICY IF EXISTS "Allow read for company employees" ON public.crm_activities;
CREATE POLICY "Allow read for company employees" ON public.crm_activities
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow insert for company employees" ON public.crm_activities;
CREATE POLICY "Allow insert for company employees" ON public.crm_activities
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Índices para Optimización de Consultas (0 Egress / Cero Latencia)
CREATE INDEX IF NOT EXISTS idx_crm_activities_company ON public.crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_client ON public.crm_activities(client_id);
