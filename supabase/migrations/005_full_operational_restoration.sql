-- 1. TABELA DE CLIENTES (Dossiê completo)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('PF', 'PJ')),
  documento TEXT UNIQUE,
  email TEXT,
  contato TEXT,
  rg TEXT,
  estado_civil TEXT,
  profissao TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  cidade TEXT DEFAULT 'Santa Maria',
  uf TEXT DEFAULT 'RS',
  cep TEXT,
  data_nascimento DATE,
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TABELA DE PROCESSOS / CONTRATOS (Teia Jurídica)
CREATE TABLE IF NOT EXISTS public.processos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id),
  valor_total NUMERIC(15,2), -- Valor do contrato/honorários
  valor_causa NUMERIC(15,2), -- Valor da causa na justiça
  natureza TEXT, -- Ex: Trabalhista, Cível, Previdenciário
  tribunal TEXT,
  vara TEXT,
  imposto NUMERIC(5,2) DEFAULT 0,
  parcelas INTEGER DEFAULT 1,
  status TEXT DEFAULT 'ativo',
  data_inicio DATE DEFAULT now(),
  data_fim DATE,
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2.1 TABELA DE TAREFAS / PRAZOS (O Coração do Escritório)
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'pendente', -- pendente, concluido
  prioridade TEXT DEFAULT 'media', -- baixa, media, alta
  data_prazo TIMESTAMP WITH TIME ZONE,
  vinculo_id UUID, -- ID do Processo ou Cliente
  vinculo_tipo TEXT, -- 'processo' ou 'cliente'
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABELA DE TRANSAÇÕES (MOTOR FINANCEIRO)
CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- receita, despesa, distribuicao
  valor NUMERIC(15,2) NOT NULL,
  data DATE DEFAULT now(),
  entidade TEXT, -- Nome do cliente ou fornecedor
  categoria TEXT DEFAULT 'Outros', -- Honorários, Custas, Marketing, etc.
  status TEXT DEFAULT 'pendente',
  concretizado BOOLEAN DEFAULT false,
  referencia TEXT, -- Numero do processo ou contrato
  conta UUID REFERENCES public.contas_bancarias(id),
  parent_id UUID REFERENCES public.transacoes(id), -- Para distribuição de comissão
  parcela_origem_id UUID,
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABELA DE CRM / ORÇAMENTOS (Funil de Vendas)
CREATE TABLE IF NOT EXISTS public.crm_orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_prospect TEXT NOT NULL,
  telefone_prospect TEXT,
  email_prospect TEXT,
  origem TEXT,
  descricao TEXT,
  valor_proposto NUMERIC(15,2),
  status TEXT DEFAULT 'prospeccao',
  data_envio DATE,
  data_retorno DATE,
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABELA DE ATENDIMENTOS
CREATE TABLE IF NOT EXISTS public.atendimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.clientes(id),
  tipo TEXT,
  descricao TEXT,
  data DATE DEFAULT now(),
  status TEXT DEFAULT 'concluido',
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. SEGURANÇA (Ativar RLS para todas)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACESSO (Simplificadas para acesso rápido do escritório)
CREATE POLICY "Acesso universal clientes v2" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Acesso universal processos v2" ON public.processos FOR ALL USING (true);
CREATE POLICY "Acesso universal transacoes v2" ON public.transacoes FOR ALL USING (true);
CREATE POLICY "Acesso universal crm v2" ON public.crm_orcamentos FOR ALL USING (true);
CREATE POLICY "Acesso universal atendimentos v2" ON public.atendimentos FOR ALL USING (true);
