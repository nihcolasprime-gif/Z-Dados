-- ==================================================
-- 008_legal_os_maturity.sql: HIERARQUIA E ARQUIVOS
-- ==================================================

-- 1. TABELA DE ARQUIVOS (O Cofre do Escritório)
CREATE TABLE IF NOT EXISTS public.arquivos_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_id UUID NOT NULL,
    vinculo_id UUID, -- ID do Cliente ou Processo
    vinculo_tipo TEXT NOT NULL, -- 'cliente', 'processo', 'financeiro'
    nome TEXT NOT NULL,
    url TEXT NOT NULL, -- Link do Supabase Storage
    tamanho BIGINT,
    formato TEXT,
    categoria TEXT DEFAULT 'Outros', -- 'procuracao', 'contrato', 'prova', 'recibo'
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nos arquivos
ALTER TABLE public.arquivos_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SaaS Master - Arquivos" ON public.arquivos_vault 
FOR ALL USING (escritorio_id = get_current_office()) WITH CHECK (escritorio_id = get_current_office());

-- 2. REFINAMENTO DE PODER NO FINANCEIRO (RBAC)
-- Removemos a política universal anterior
DROP POLICY IF EXISTS "SaaS Master - Transacoes" ON public.transacoes;

-- Nova Política: Dono vê tudo, Equipe vê apenas o lucro dela
CREATE POLICY "Legal OS - Financial RBAC" ON public.transacoes
FOR ALL USING (
    escritorio_id = (SELECT escritorio_id FROM colaboradores WHERE user_id = auth.uid()) AND (
        -- Regra 1: O Dono (Master) vê absolutamente tudo do escritório
        (SELECT tipo FROM colaboradores WHERE user_id = auth.uid()) = 'master' 
        OR
        -- Regra 2: O Colaborador vê apenas transações onde ele é o beneficiário (comissões)
        beneficiario_id = (SELECT id FROM colaboradores WHERE user_id = auth.uid())
    )
) WITH CHECK (
    escritorio_id = (SELECT escritorio_id FROM colaboradores WHERE user_id = auth.uid())
);

-- 3. ADIÇÃO DE CAMPO DE REEMBOLSO (Opcional para o "Sabão")
-- Se o colaborador comprar algo, ele registra mas fica como "pendente" para o Master aprovar
ALTER TABLE public.transacoes ADD COLUMN IF NOT EXISTS solicitado_por UUID REFERENCES public.colaboradores(id);

-- 4. INDICE DE PERFORMANCE PARA A JORNADA
CREATE INDEX IF NOT EXISTS idx_transacoes_beneficiario ON public.transacoes(beneficiario_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_vinculo ON public.arquivos_vault(vinculo_id);
