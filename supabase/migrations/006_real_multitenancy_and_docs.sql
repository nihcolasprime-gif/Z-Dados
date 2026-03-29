-- ==========================================
-- 1. IDENTIDADE DO ESCRITÓRIO (SaaS Master)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.escritorios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    logo_url TEXT,
    site TEXT,
    email_contato TEXT,
    telefone TEXT,
    endereco_completo TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- 2. MOTOR DE DOCUMENTOS (AUTOMATIZAÇÃO)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.documento_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escritorio_id UUID REFERENCES public.escritorios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL, -- Ex: Procuração Ad Judicia, Contrato de Honorários
    tipo TEXT CHECK (tipo IN ('procuracao', 'contrato', 'peticao', 'oficio')),
    conteudo_html TEXT NOT NULL, -- Conteúdo com tags {{cliente_nome}}, {{cliente_cpf}}, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- 3. AJUSTE DE COLABORADORES (VÍNCULO REAL)
-- ==========================================
-- Garantir que a tabela colaboradores use UUID para o escritório
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaboradores' AND column_name = 'escritorio_id' AND data_type = 'text') THEN
    ALTER TABLE public.colaboradores ALTER COLUMN escritorio_id TYPE UUID USING escritorio_id::uuid;
  END IF;
END $$;

-- ==========================================
-- 4. FUNÇÃO DE SEGURANÇA (ISOLAMENTO SaaS)
-- ==========================================
-- Esta função identifica o escritório do usuário logado no Supabase Auth
CREATE OR REPLACE FUNCTION public.get_current_office()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT escritorio_id FROM public.colaboradores WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ==========================================
-- 5. BLINDAGEM TOTAL (RLS)
-- ==========================================
-- 5.1 Remover políticas antigas de "acesso universal"
DROP POLICY IF EXISTS "Acesso universal clientes v2" ON public.clientes;
DROP POLICY IF EXISTS "Acesso universal processos v2" ON public.processos;
DROP POLICY IF EXISTS "Acesso universal transacoes v2" ON public.transacoes;
DROP POLICY IF EXISTS "Acesso universal crm v2" ON public.crm_orcamentos;
DROP POLICY IF EXISTS "Acesso universal atendimentos v2" ON public.atendimentos;

-- 5.2 Aplicar Políticas de Isolamento Reais (SaaS Security)
-- Clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - Clientes" ON public.clientes 
FOR ALL USING (escritorio_id::uuid = get_current_office());

-- Processos / Contratos
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - Processos" ON public.processos 
FOR ALL USING (escritorio_id::uuid = get_current_office());

-- Transações Financeiras
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - Transacoes" ON public.transacoes 
FOR ALL USING (escritorio_id::uuid = get_current_office());

-- CRM e Orçamentos
ALTER TABLE public.crm_orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - CRM" ON public.crm_orcamentos 
FOR ALL USING (escritorio_id::uuid = get_current_office());

-- Atendimentos
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - Atendimentos" ON public.atendimentos 
FOR ALL USING (escritorio_id::uuid = get_current_office());

-- Tarefas e Prazos
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - Tarefas" ON public.tarefas 
FOR ALL USING (escritorio_id::uuid = get_current_office());

-- Templates de Documentos
ALTER TABLE public.documento_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Isolation - Templates" ON public.documento_templates 
FOR ALL USING (escritorio_id = get_current_office());

-- ==========================================
-- 6. INSERÇÃO DE DADOS INICIAIS (SEED)
-- ==========================================
-- Criar o escritório padrão se não existir para evitar erros de login inicial
INSERT INTO public.escritorios (id, nome) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Meu Escritório Modelo')
ON CONFLICT (id) DO NOTHING;
