-- Generated Supabase Database Schema Dump (100% Programmatic Replica)
-- Generated on 2026-06-24

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. TABLES CREATION
-- ==========================================

-- Table: public.activities
CREATE TABLE public.activities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    type text NOT NULL,
    payload jsonb NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NULL DEFAULT now(),
    CONSTRAINT activities_pkey PRIMARY KEY (id)
);

-- Table: public.branches
CREATE TABLE public.branches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    name text NOT NULL,
    address text NULL,
    phone text NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT branches_pkey PRIMARY KEY (id)
);

-- Table: public.clients
CREATE TABLE public.clients (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    name text NOT NULL,
    email text NULL,
    phone text NULL,
    address text NULL,
    document_id text NULL,
    document_type text NOT NULL DEFAULT '13'::text,
    type text NOT NULL DEFAULT 'persona_natural'::text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    country text NULL,
    currency text NULL,
    CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- Table: public.companies
CREATE TABLE public.companies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    logo_url text NULL,
    country text NULL DEFAULT 'Colombia'::text,
    currency text NULL DEFAULT 'COP'::text,
    settings jsonb NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- Table: public.crm_activities
CREATE TABLE public.crm_activities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    client_id uuid NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    metadata jsonb NULL DEFAULT '{}'::jsonb,
    created_by uuid NULL,
    created_at timestamptz NULL DEFAULT now(),
    CONSTRAINT crm_activities_pkey PRIMARY KEY (id)
);

-- Table: public.events
CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NULL,
    event text NOT NULL,
    metadata jsonb NULL DEFAULT '{}'::jsonb,
    created_at timestamp NULL DEFAULT now(),
    CONSTRAINT events_pkey PRIMARY KEY (id)
);

-- Table: public.expenses
CREATE TABLE public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    amount numeric NOT NULL,
    category text NOT NULL,
    description text NULL,
    provider_name text NULL DEFAULT 'Proveedor Varios'::text,
    provider_doc_id text NULL,
    provider_doc_type text NULL DEFAULT '31'::text,
    iva_paid numeric NULL DEFAULT 0.00,
    retencion numeric NULL DEFAULT 0.00,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    branch_id uuid NULL,
    CONSTRAINT expenses_pkey PRIMARY KEY (id)
);

-- Table: public.hr_employees
CREATE TABLE public.hr_employees (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    profile_id uuid NULL,
    full_name varchar(150) NOT NULL,
    email varchar(150) NOT NULL,
    phone varchar(50) NULL,
    document_id varchar(50) NOT NULL,
    hire_date date NOT NULL DEFAULT CURRENT_DATE,
    termination_date date NULL,
    salary numeric NOT NULL DEFAULT 1300000.00,
    position varchar(100) NOT NULL,
    department varchar(100) NOT NULL,
    status varchar(20) NULL DEFAULT 'active'::character varying,
    arl_class varchar(20) NULL DEFAULT 'clase_1'::character varying,
    bank_account varchar(100) NULL,
    bank_name varchar(100) NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT hr_employees_pkey PRIMARY KEY (id)
);

-- Table: public.hr_recruitment_candidates
CREATE TABLE public.hr_recruitment_candidates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    full_name varchar(150) NOT NULL,
    email varchar(150) NOT NULL,
    phone varchar(50) NULL,
    position varchar(100) NOT NULL,
    stage varchar(20) NULL DEFAULT 'applied'::character varying,
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT hr_recruitment_candidates_pkey PRIMARY KEY (id)
);

-- Table: public.hr_vacations
CREATE TABLE public.hr_vacations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    employee_id uuid NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    requested_days integer NOT NULL,
    status varchar(20) NULL DEFAULT 'pending'::character varying,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT hr_vacations_pkey PRIMARY KEY (id)
);

-- Table: public.invoice_payments
CREATE TABLE public.invoice_payments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    invoice_id text NOT NULL,
    amount numeric NOT NULL,
    reference text NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT invoice_payments_pkey PRIMARY KEY (id)
);

-- Table: public.invoices
CREATE TABLE public.invoices (
    id text NOT NULL,
    company_id uuid NOT NULL,
    client_id uuid NULL,
    client_name text NOT NULL,
    subtotal numeric NOT NULL DEFAULT 0.00,
    tax numeric NOT NULL DEFAULT 0.00,
    total numeric NOT NULL DEFAULT 0.00,
    payment_type text NOT NULL DEFAULT 'immediate'::text,
    payment_status text NOT NULL DEFAULT 'paid'::text,
    scheduled_date timestamptz NULL,
    paid_at timestamptz NULL,
    note text NULL,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    cufe text NULL,
    qr_url text NULL,
    xml_url text NULL,
    dian_status text NULL DEFAULT 'unsubmitted'::text,
    branch_id uuid NULL,
    CONSTRAINT invoices_pkey PRIMARY KEY (id)
);

-- Table: public.notifications
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    user_id uuid NULL,
    type text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Table: public.payroll_concepts
CREATE TABLE public.payroll_concepts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    type varchar(20) NOT NULL,
    formula text NOT NULL,
    is_system boolean NULL DEFAULT false,
    active boolean NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT payroll_concepts_pkey PRIMARY KEY (id),
    CONSTRAINT unique_company_concept_code UNIQUE (company_id, code)
);

-- Table: public.payroll_result_items
CREATE TABLE public.payroll_result_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    payroll_result_id uuid NULL,
    concept_id uuid NULL,
    type varchar(20) NOT NULL,
    amount numeric NOT NULL,
    formula_applied text NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT payroll_result_items_pkey PRIMARY KEY (id)
);

-- Table: public.payroll_results
CREATE TABLE public.payroll_results (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    payroll_run_id uuid NULL,
    employee_id uuid NULL,
    salary_base numeric NOT NULL,
    total_accrued numeric NOT NULL,
    total_deductions numeric NOT NULL,
    total_net numeric NOT NULL,
    details_json jsonb NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT payroll_results_pkey PRIMARY KEY (id)
);

-- Table: public.payroll_runs
CREATE TABLE public.payroll_runs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status varchar(20) NULL DEFAULT 'draft'::character varying,
    total_accrued numeric NULL DEFAULT 0.00,
    total_deductions numeric NULL DEFAULT 0.00,
    total_net numeric NULL DEFAULT 0.00,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT payroll_runs_pkey PRIMARY KEY (id)
);

-- Table: public.personal_loans
CREATE TABLE public.personal_loans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    contact_name text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    description text NULL,
    due_date date NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT personal_loans_pkey PRIMARY KEY (id)
);

-- Table: public.products
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL DEFAULT 0.00,
    cost numeric NOT NULL DEFAULT 0.00,
    category text NOT NULL DEFAULT 'Otros'::text,
    unit text NOT NULL DEFAULT 'UND'::text,
    stock numeric NOT NULL DEFAULT 0.000,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    branch_id uuid NULL,
    attachment_url text NULL,
    attachment_name text NULL,
    discount_type text NULL,
    discount_value numeric NULL,
    discount_ends_at timestamptz NULL,
    CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Table: public.profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    full_name text NULL,
    email text NULL,
    phone text NULL,
    role text NOT NULL DEFAULT 'empleado'::text,
    plan text NOT NULL DEFAULT 'free'::text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    branch_id uuid NULL,
    permissions jsonb NULL DEFAULT '[]'::jsonb,
    active_session_id text NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Table: public.api_keys
CREATE TABLE public.api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    key_hash text NOT NULL,
    label text NOT NULL DEFAULT 'GestiBot Key'::text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT api_keys_pkey PRIMARY KEY (id)
);

-- Table: public.subscriptions
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    plan varchar(50) NOT NULL DEFAULT 'free'::character varying,
    status varchar(20) NOT NULL DEFAULT 'active'::character varying,
    active_employees_limit integer NULL DEFAULT 5,
    payroll_runs_limit integer NULL DEFAULT 1,
    billing_period_start date NULL,
    billing_period_end date NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT subscriptions_company_id_key UNIQUE (company_id)
);

-- Table: public.usage_tracking
CREATE TABLE public.usage_tracking (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL,
    metric_type varchar(50) NOT NULL,
    current_usage integer NULL DEFAULT 0,
    last_updated timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT usage_tracking_pkey PRIMARY KEY (id)
);

-- ==========================================
-- 3. CUSTOM FUNCTIONS CREATION
-- ==========================================

-- get_user_company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$function$;

-- delete_orphaned_company
CREATE OR REPLACE FUNCTION public.delete_orphaned_company()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_count INT;
BEGIN
  -- Contamos cuántos usuarios quedan en la empresa
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE company_id = OLD.company_id;
  
  -- Si ya no queda nadie (porque borraste al dueño), detonamos la empresa
  IF profile_count = 0 THEN
    DELETE FROM companies WHERE id = OLD.company_id;
  END IF;
  
  RETURN OLD;
END;
$function$;

-- use_invitation_code
CREATE OR REPLACE FUNCTION public.use_invitation_code(inv_code text, worker_email text)
 RETURNS TABLE(company_id uuid, invite_role text, company_plan text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    comp_row RECORD;
    inv_item JSONB;
    new_invitations JSONB := '[]'::jsonb;
    found BOOLEAN := false;
    matched_role TEXT;
BEGIN
    -- Recorrer todas las empresas buscando la invitación activa con el código ingresado
    FOR comp_row IN SELECT id, settings, plan FROM public.companies LOOP
        IF comp_row.settings ? 'invitations' THEN
            new_invitations := '[]'::jsonb;
            found := false;
            
            FOR inv_item IN SELECT * FROM jsonb_array_elements(comp_row.settings->'invitations') LOOP
                IF (inv_item->>'code' = inv_code) AND (inv_item->>'used' = 'false') AND ((inv_item->>'expiresAt')::timestamp > now()) THEN
                    found := true;
                    matched_role := inv_item->>'role';
                    -- Marcar la invitación como usada
                    new_invitations := new_invitations || jsonb_build_object(
                        'code', inv_item->>'code',
                        'role', inv_item->>'role',
                        'expiresAt', inv_item->>'expiresAt',
                        'created', inv_item->>'created',
                        'used', true,
                        'usedBy', worker_email,
                        'usedAt', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                    );
                ELSE
                    new_invitations := new_invitations || inv_item;
                END IF;
            END LOOP;
            
            -- Si encontramos la invitación activa, guardamos los ajustes actualizados y retornamos el resultado
            IF found THEN
                UPDATE public.companies 
                SET settings = jsonb_set(settings, '{invitations}', new_invitations)
                WHERE id = comp_row.id;
                
                company_id := comp_row.id;
                invite_role := matched_role;
                company_plan := COALESCE(comp_row.plan, 'standard');
                RETURN NEXT;
                RETURN;
            END IF;
        END IF;
    END LOOP;
    
    -- Si no se encontró ningún código de invitación activo, lanzar una excepción
    RAISE EXCEPTION 'Código de vinculación inválido, ya usado o caducado.';
END;
$function$;

-- ==========================================
-- 4. VIEWS CREATION
-- ==========================================

CREATE OR REPLACE VIEW public.v_dashboard_metrics AS
 SELECT i.company_id,
    to_char(i.created_at, 'YYYY-MM'::text) AS month,
    sum(
        CASE
            WHEN (i.payment_status = 'paid'::text) THEN i.total
            ELSE (0)::numeric
        END) AS full_paid_revenue,
    sum(COALESCE(p.total_abonos, (0)::numeric)) AS abonos_revenue,
    sum(
        CASE
            WHEN (i.payment_status = ANY (ARRAY['pending'::text, 'overdue'::text])) THEN GREATEST((0)::numeric, (i.total - COALESCE(p.total_abonos, (0)::numeric)))
            ELSE (0)::numeric
        END) AS pending_balance
   FROM (invoices i
     LEFT JOIN ( SELECT invoice_payments.invoice_id,
            sum(invoice_payments.amount) AS total_abonos
           FROM invoice_payments
          GROUP BY invoice_payments.invoice_id) p ON ((i.id = p.invoice_id)))
  GROUP BY i.company_id, (to_char(i.created_at, 'YYYY-MM'::text));

-- ==========================================
-- 5. INDEXES CREATION
-- ==========================================
CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id);
CREATE UNIQUE INDEX idx_api_keys_hash ON public.api_keys USING btree (key_hash) WHERE (activo = true);
CREATE INDEX idx_api_keys_company ON public.api_keys USING btree (company_id);
CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);
CREATE INDEX idx_activities_tenant ON public.activities USING btree (tenant_id);
CREATE UNIQUE INDEX branches_pkey ON public.branches USING btree (id);
CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id);
CREATE INDEX idx_clients_company ON public.clients USING btree (company_id);
CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);
CREATE UNIQUE INDEX crm_activities_pkey ON public.crm_activities USING btree (id);
CREATE INDEX idx_crm_activities_client ON public.crm_activities USING btree (client_id);
CREATE INDEX idx_crm_activities_company ON public.crm_activities USING btree (company_id);
CREATE INDEX idx_crm_client ON public.crm_activities USING btree (client_id);
CREATE INDEX idx_crm_company ON public.crm_activities USING btree (company_id);
CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);
CREATE INDEX idx_events_created_at ON public.events USING btree (created_at DESC);
CREATE INDEX idx_events_event ON public.events USING btree (event);
CREATE INDEX idx_events_user_id ON public.events USING btree (user_id);
CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (id);
CREATE INDEX idx_expenses_company ON public.expenses USING btree (company_id);
CREATE UNIQUE INDEX hr_employees_pkey ON public.hr_employees USING btree (id);
CREATE INDEX idx_hr_employees_company ON public.hr_employees USING btree (company_id);
CREATE UNIQUE INDEX hr_recruitment_candidates_pkey ON public.hr_recruitment_candidates USING btree (id);
CREATE INDEX idx_hr_recruitment_company ON public.hr_recruitment_candidates USING btree (company_id);
CREATE UNIQUE INDEX hr_vacations_pkey ON public.hr_vacations USING btree (id);
CREATE INDEX idx_hr_vacations_company ON public.hr_vacations USING btree (company_id);
CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments USING btree (invoice_id);
CREATE INDEX idx_payments_invoice ON public.invoice_payments USING btree (invoice_id);
CREATE UNIQUE INDEX invoice_payments_pkey ON public.invoice_payments USING btree (id);
CREATE INDEX idx_invoices_company ON public.invoices USING btree (company_id);
CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);
CREATE INDEX idx_payroll_concepts_company ON public.payroll_concepts USING btree (company_id);
CREATE UNIQUE INDEX payroll_concepts_pkey ON public.payroll_concepts USING btree (id);
CREATE UNIQUE INDEX unique_company_concept_code ON public.payroll_concepts USING btree (company_id, code);
CREATE INDEX idx_payroll_result_items_company ON public.payroll_result_items USING btree (company_id);
CREATE UNIQUE INDEX payroll_result_items_pkey ON public.payroll_result_items USING btree (id);
CREATE INDEX idx_payroll_results_company ON public.payroll_results USING btree (company_id);
CREATE INDEX idx_payroll_results_run ON public.payroll_results USING btree (payroll_run_id);
CREATE UNIQUE INDEX payroll_results_pkey ON public.payroll_results USING btree (id);
CREATE INDEX idx_payroll_runs_company ON public.payroll_runs USING btree (company_id);
CREATE UNIQUE INDEX payroll_runs_pkey ON public.payroll_runs USING btree (id);
CREATE UNIQUE INDEX personal_loans_pkey ON public.personal_loans USING btree (id);
CREATE INDEX personal_loans_user_id_idx ON public.personal_loans USING btree (user_id);
CREATE INDEX idx_products_company ON public.products USING btree (company_id);
CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE INDEX idx_sub_company ON public.subscriptions USING btree (company_id);
CREATE INDEX idx_subscriptions_company ON public.subscriptions USING btree (company_id);
CREATE UNIQUE INDEX subscriptions_company_id_key ON public.subscriptions USING btree (company_id);
CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);
CREATE INDEX idx_usage_tracking_company ON public.usage_tracking USING btree (company_id);
CREATE UNIQUE INDEX usage_tracking_pkey ON public.usage_tracking USING btree (id);

-- ==========================================
-- 6. FOREIGN KEY CONSTRAINTS
-- ==========================================
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_payments ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.branches ADD CONSTRAINT branches_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD CONSTRAINT products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE public.hr_employees ADD CONSTRAINT hr_employees_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payroll_results ADD CONSTRAINT payroll_results_payroll_run_id_fkey FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_results ADD CONSTRAINT payroll_results_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_result_items ADD CONSTRAINT payroll_result_items_payroll_result_id_fkey FOREIGN KEY (payroll_result_id) REFERENCES payroll_results(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_result_items ADD CONSTRAINT payroll_result_items_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES payroll_concepts(id) ON DELETE RESTRICT;
ALTER TABLE public.hr_vacations ADD CONSTRAINT hr_vacations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE;
ALTER TABLE public.activities ADD CONSTRAINT activities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.personal_loans ADD CONSTRAINT personal_loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.crm_activities ADD CONSTRAINT fk_crm_activities_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE public.crm_activities ADD CONSTRAINT fk_crm_activities_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE public.crm_activities ADD CONSTRAINT fk_crm_activities_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- ==========================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_recruitment_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_result_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL TO public USING (((company_id = get_user_company_id()) OR (id = auth.uid()))) ;
CREATE POLICY "clients_policy" ON public.clients FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "products_policy" ON public.products FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "invoices_policy" ON public.invoices FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "expenses_policy" ON public.expenses FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "invoice_payments_policy" ON public.invoice_payments FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "notifications_policy" ON public.notifications FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "companies_insert_policy" ON public.companies FOR INSERT TO public  WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "companies_select_policy" ON public.companies FOR SELECT TO public USING ((auth.uid() IS NOT NULL)) ;
CREATE POLICY "companies_update_policy" ON public.companies FOR UPDATE TO public USING ((id = get_user_company_id())) WITH CHECK ((id = get_user_company_id()));
CREATE POLICY "companies_delete_policy" ON public.companies FOR DELETE TO public USING ((id = get_user_company_id())) ;
CREATE POLICY "branches_policy" ON public.branches FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "api_keys_policy" ON public.api_keys FOR ALL TO public USING ((company_id = get_user_company_id())) ;
CREATE POLICY "Permitir actualización de empresa a administradores" ON public.companies FOR UPDATE TO authenticated USING ((id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrador'::text))))) WITH CHECK ((id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrador'::text)))));
CREATE POLICY "Permitir lectura de clientes a miembros de la empresa" ON public.clients FOR SELECT TO authenticated USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Permitir lectura a miembros de la empresa" ON public.companies FOR SELECT TO authenticated USING ((id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Permitir actualización a miembros de la empresa" ON public.companies FOR UPDATE TO authenticated USING ((id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) WITH CHECK ((id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
CREATE POLICY "Users can manage their own personal loans" ON public.personal_loans FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Permitir lectura de empresa a sus miembros" ON public.companies FOR SELECT TO authenticated USING ((id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en payroll_concepts" ON public.payroll_concepts FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en hr_employees" ON public.hr_employees FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Permitir inserción de clientes a miembros de la empresa" ON public.clients FOR INSERT TO authenticated  WITH CHECK ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
CREATE POLICY "Permitir actualización de clientes a miembros de la empresa" ON public.clients FOR UPDATE TO authenticated USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) WITH CHECK ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
CREATE POLICY "Permitir eliminación de clientes a administradores" ON public.clients FOR DELETE TO authenticated USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrador'::text))))) ;
CREATE POLICY "Aislamiento por Empresa en payroll_runs" ON public.payroll_runs FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en payroll_results" ON public.payroll_results FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en payroll_result_items" ON public.payroll_result_items FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en hr_vacations" ON public.hr_vacations FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en hr_recruitment_candidates" ON public.hr_recruitment_candidates FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en subscriptions" ON public.subscriptions FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Aislamiento por Empresa en usage_tracking" ON public.usage_tracking FOR ALL TO public USING ((company_id = ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Allow read for company employees" ON public.crm_activities FOR SELECT TO public USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Allow insert for company employees" ON public.crm_activities FOR INSERT TO public  WITH CHECK ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
CREATE POLICY "Permitir lectura de clientes por empresa" ON public.clients FOR SELECT TO public USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Permitir inserción de clientes por empresa" ON public.clients FOR INSERT TO public  WITH CHECK ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
CREATE POLICY "Permitir modificación de clientes por empresa" ON public.clients FOR UPDATE TO public USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Permitir eliminación de clientes por empresa" ON public.clients FOR DELETE TO public USING ((company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) ;
CREATE POLICY "Permitir a administradores actualizar su propia empresa" ON public.companies FOR UPDATE TO authenticated USING ((id = ( SELECT profiles.company_id
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrador'::text))))) WITH CHECK ((id = ( SELECT profiles.company_id
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrador'::text)))));

-- ==========================================
-- 9. STORAGE BUCKETS & POLICIES
-- ==========================================

-- Insert buckets config
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('attachments', 'attachments', true, 52428800, null),
    ('facturas-pdf', 'facturas-pdf', true, null, null)
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public, 
    file_size_limit = EXCLUDED.file_size_limit, 
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage object policies
CREATE POLICY "storage_insert_facturas" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'facturas-pdf'::text);
CREATE POLICY "storage_update_facturas" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'facturas-pdf'::text);
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'facturas-pdf'::text);

-- ==========================================
-- 10. REALTIME CONFIGURATION
-- ==========================================

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
