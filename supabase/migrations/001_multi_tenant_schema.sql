-- ==========================================
-- 0. EXTENSÕES NECESSÁRIAS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ESTRUTURA BASE MULTI-TENANT (EMPRESAS)
-- ==========================================
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    plano TEXT DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 2. CRIAÇÃO DAS TABELAS DO SISTEMA
-- ==========================================

-- 2.1 Colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link direto com o Supabase Auth (Login)
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    oab TEXT,
    tipo TEXT NOT NULL,
    comissao_padrao DECIMAL(5,2),
    ativo BOOLEAN DEFAULT true,
    avatar_url TEXT
);

-- 2.2 Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT,
    doc TEXT,
    documento TEXT,
    email TEXT,
    contato TEXT,
    rg TEXT,
    estado_civil TEXT,
    profissao TEXT,
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    data_nascimento DATE
);

-- 2.3 Processos (Contratos)
CREATE TABLE IF NOT EXISTS processos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    numero TEXT,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nome TEXT,
    valor_total DECIMAL(15,2),
    imposto DECIMAL(5,2),
    parcelas INTEGER,
    colaboradores JSONB,
    data_inicio DATE,
    status TEXT
);

-- 2.4 Transações (Financeiro)
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data DATE NOT NULL,
    entidade TEXT,
    status TEXT,
    concretizado BOOLEAN DEFAULT false,
    referencia TEXT,
    conta TEXT,
    parent_id UUID REFERENCES transacoes(id) ON DELETE CASCADE,
    beneficiario_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
    parcela_origem_id UUID,
    data_pagamento DATE
);

-- 2.5 Demandas (Tarefas)
CREATE TABLE IF NOT EXISTS demandas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT,
    prioridade TEXT,
    data_prazo DATE,
    data_limite DATE,
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
    vinculo_id UUID,
    vinculo_tipo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.6 CRM Orçamentos
CREATE TABLE IF NOT EXISTS crm_orcamentos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    nome_prospect TEXT NOT NULL,
    telefone_prospect TEXT NOT NULL,
    email_prospect TEXT,
    origem TEXT,
    descricao TEXT,
    valor_proposto DECIMAL(15,2),
    status TEXT,
    data_envio DATE,
    data_retorno DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.7 Distribuições
CREATE TABLE IF NOT EXISTS distribuicoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    processo TEXT,
    honorario DECIMAL(15,2),
    percentual DECIMAL(5,2),
    data DATE,
    status TEXT,
    "baseLiquida" DECIMAL(15,2),
    valor DECIMAL(15,2),
    referencia TEXT
);

-- ==========================================
-- 3. ÍNDICES DE PERFORMANCE (Crucial para SaaS)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa ON colaboradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_processos_empresa ON processos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa ON transacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_demandas_empresa ON demandas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_empresa ON crm_orcamentos(empresa_id);

-- ==========================================
-- 4. FUNÇÃO DE ISOLAMENTO (ANTI-VAZAMENTO)
-- ==========================================
-- Retorna o empresa_id ao qual o usuário logado no Auth pertence
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT empresa_id FROM colaboradores WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ==========================================
-- 5. APLICAÇÃO DO ROW LEVEL SECURITY (RLS) E PROTEÇÃO HACKER
-- ==========================================

-- Habilita proteção obrigatória em todas as tabelas:
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuicoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolamento (Nenhuma query executa sem o empresa_id estar alinhado):
CREATE POLICY "Tenant Isolation - Empresas" ON empresas FOR ALL USING (id = get_current_tenant());
CREATE POLICY "Tenant Isolation - Colaboradores" ON colaboradores FOR ALL USING (empresa_id = get_current_tenant());
CREATE POLICY "Tenant Isolation - Clientes" ON clientes FOR ALL USING (empresa_id = get_current_tenant());
CREATE POLICY "Tenant Isolation - Processos" ON processos FOR ALL USING (empresa_id = get_current_tenant());
CREATE POLICY "Tenant Isolation - Transacoes" ON transacoes FOR ALL USING (empresa_id = get_current_tenant());
CREATE POLICY "Tenant Isolation - Demandas" ON demandas FOR ALL USING (empresa_id = get_current_tenant());
CREATE POLICY "Tenant Isolation - CRM" ON crm_orcamentos FOR ALL USING (empresa_id = get_current_tenant());
CREATE POLICY "Tenant Isolation - Distribuicoes" ON distribuicoes FOR ALL USING (empresa_id = get_current_tenant());

-- ==========================================
-- 6. AUTOMAÇÃO DE CADASTRO (TRIAL 7 DIAS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
  new_empresa_id UUID;
BEGIN
  -- 1. Cria a empresa associada ao novo registro
  INSERT INTO public.empresas (nome, plano)
  VALUES (COALESCE(new.raw_user_meta_data->>'empresa_nome', 'Meu Escritório'), 'trial')
  RETURNING id INTO new_empresa_id;

  -- 2. Cadastra o advogado como Administrador 'master' da empresa criada
  INSERT INTO public.colaboradores (user_id, empresa_id, nome, email, tipo)
  VALUES (new.id, new_empresa_id, COALESCE(new.raw_user_meta_data->>'nome', 'Administrador'), new.email, 'master');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atrela o registro do usuário à automação acima
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_registration();
