-- ====================================================================
-- SCRIPT DE MIGRACIÓN: PRÉSTAMOS PERSONALES Y AJUSTE DE RLS PARA BOLSILLOS
-- ====================================================================
-- Ejecuta este script en el editor SQL de tu panel de Supabase.
-- ====================================================================

-- 1. HABILITAR EXTENSIÓN PARA GENERAR UUIDs (Si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREACIÓN DE LA TABLA DE PRÉSTAMOS PERSONALES (personal_loans)
CREATE TABLE IF NOT EXISTS public.personal_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')), -- 'lent' (prestado / por cobrar), 'borrowed' (recibido / por pagar)
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en personal_loans
ALTER TABLE public.personal_loans ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para personal_loans (Solo el dueño de los datos puede ver, crear, actualizar o borrar)
DROP POLICY IF EXISTS "Users can manage their own personal loans" ON public.personal_loans;
CREATE POLICY "Users can manage their own personal loans"
    ON public.personal_loans
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Crear un índice para mejorar la velocidad de consulta
CREATE INDEX IF NOT EXISTS personal_loans_user_id_idx ON public.personal_loans(user_id);


-- 3. AJUSTE DE RLS EN LA TABLA DE EMPRESAS (companies) PARA PERMITIR GUARDAR BOLSILLOS
-- Asegurarse de que RLS está activo en companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Política de lectura de empresa: Permitir lectura a miembros de la empresa
DROP POLICY IF EXISTS "Permitir lectura de empresa a sus miembros" ON public.companies;
CREATE POLICY "Permitir lectura de empresa a sus miembros"
    ON public.companies
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Política de actualización de empresa: Permitir a administradores guardar configuraciones y bolsillos
DROP POLICY IF EXISTS "Permitir actualización de empresa a administradores" ON public.companies;
CREATE POLICY "Permitir actualización de empresa a administradores"
    ON public.companies
    FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
        )
    )
    WITH CHECK (
        id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
        )
    );


-- 4. AJUSTE DE RLS EN LA TABLA DE CLIENTES (clients)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Política de lectura de clientes
DROP POLICY IF EXISTS "Permitir lectura de clientes a miembros de la empresa" ON public.clients;
CREATE POLICY "Permitir lectura de clientes a miembros de la empresa"
    ON public.clients
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Política de inserción de clientes
DROP POLICY IF EXISTS "Permitir inserción de clientes a miembros de la empresa" ON public.clients;
CREATE POLICY "Permitir inserción de clientes a miembros de la empresa"
    ON public.clients
    FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Política de actualización de clientes
DROP POLICY IF EXISTS "Permitir actualización de clientes a miembros de la empresa" ON public.clients;
CREATE POLICY "Permitir actualización de clientes a miembros de la empresa"
    ON public.clients
    FOR UPDATE
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Política de eliminación de clientes
DROP POLICY IF EXISTS "Permitir eliminación de clientes a administradores" ON public.clients;
CREATE POLICY "Permitir eliminación de clientes a administradores"
    ON public.clients
    FOR DELETE
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
        )
    );


-- 5. ACTUALIZAR PLAN A PREMIUM PARA dayanneguiselle@gmail.com
UPDATE public.companies
SET plan = 'empresarial'
WHERE id IN (
    SELECT company_id
    FROM public.profiles
    WHERE LOWER(email) = 'dayanneguiselle@gmail.com'
);

UPDATE public.profiles
SET plan = 'empresarial'
WHERE LOWER(email) = 'dayanneguiselle@gmail.com';
