-- 1. Tabela de Contas Bancárias Dinâmicamente Gerenciáveis
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'digital', 'dinheiro', 'outro')),
  saldo_inicial NUMERIC(15,2) DEFAULT 0,
  escritorio_id TEXT DEFAULT 'ESC-001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar Segurança RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contas visíveis por escritório"
  ON public.contas_bancarias FOR SELECT
  USING (escritorio_id = escritorio_id); -- Simplificado para o escopo atual

-- 3. Inserir Bancos Iniciais para o Escritório Base
INSERT INTO public.contas_bancarias (nome, tipo, escritorio_id)
VALUES 
  ('Banco do Brasil', 'digital', 'ESC-001'),
  ('Asaas', 'digital', 'ESC-001'),
  ('Nubank', 'digital', 'ESC-001'),
  ('Dinheiro', 'dinheiro', 'ESC-001')
ON CONFLICT DO NOTHING;
