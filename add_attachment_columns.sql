-- Agregar columnas de adjunto a la tabla products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS attachment_url  TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;
