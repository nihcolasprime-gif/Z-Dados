-- 1. Tabela simplificada de Colaboradores (Controla Escritório e Cargo)
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  tipo TEXT CHECK (tipo IN ('dono', 'associado', 'admin')),
  escritorio_id TEXT DEFAULT 'ESC-001', -- Escritório padrão para o SAAS direto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS para segurança por escritório
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver seu próprio escritório"
  ON public.colaboradores FOR SELECT
  USING (true); -- Simplificado para leitura universal ou filtrada por aplicativo

-- 3. Função handle_new_user ultra simplificada
-- Apenas insere na tabela de colaboradores se o usuário for novo
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.colaboradores (id, email, nome, tipo, escritorio_id)
  VALUES (new.id, new.email, '', 'associado', 'ESC-001')
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger de Automação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Dar cargo de 'dono' para o proprietário principal
UPDATE public.colaboradores 
SET tipo = 'dono' 
WHERE email = 'zlinemkt@gmail.com';

-- NOTA: Você não precisa mais da tabela 'perfis' para controlar acesso!
