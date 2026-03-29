-- ==================================================
-- 007_master_saas_rls.sql: BLINDAGEM MESTRA
-- ==================================================

-- 1. LIMPEZA DE RLS ANTERIOR (TABELAS DE OPERAÇÃO)
DROP POLICY IF EXISTS "Contas visíveis por escritório" ON public.contas_bancarias;
DROP POLICY IF EXISTS "SaaS Isolation - Clientes" ON public.clientes;
DROP POLICY IF EXISTS "SaaS Isolation - Processos" ON public.processos;
DROP POLICY IF EXISTS "SaaS Isolation - Transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "SaaS Isolation - CRM" ON public.crm_orcamentos;
DROP POLICY IF EXISTS "SaaS Isolation - Atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "SaaS Isolation - Tarefas" ON public.tarefas;

-- 2. CONVERSÃO DE IDs PARA UUID (SaaS Nativo)
-- Contas Bancárias
ALTER TABLE public.contas_bancarias ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;
-- Clientes
ALTER TABLE public.clientes ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;
-- Processos
ALTER TABLE public.processos ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;
-- Transacoes
ALTER TABLE public.transacoes ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;
-- CRM
ALTER TABLE public.crm_orcamentos ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;
-- Atendimentos
ALTER TABLE public.atendimentos ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;
-- Tarefas
ALTER TABLE public.tarefas ALTER COLUMN escritorio_id TYPE UUID USING CASE WHEN escritorio_id = 'ESC-001' THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE escritorio_id::uuid END;

-- 3. POLÍTICAS DE SEGURANÇA FINAL (Impenetráveis)
-- Reutiliza a função get_current_office() definida na 006

-- Contas Bancárias
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Master - Contas" ON public.contas_bancarias 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- Clientes
CREATE POLICY "SaaS Master - Clientes" ON public.clientes 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- Processos
CREATE POLICY "SaaS Master - Processos" ON public.processos 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- Transações
CREATE POLICY "SaaS Master - Transacoes" ON public.transacoes 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- CRM e Orçamentos
CREATE POLICY "SaaS Master - CRM" ON public.crm_orcamentos 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- Atendimentos
CREATE POLICY "SaaS Master - Atendimentos" ON public.atendimentos 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- Tarefas e Prazos
CREATE POLICY "SaaS Master - Tarefas" ON public.tarefas 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());
