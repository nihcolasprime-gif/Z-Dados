-- ==========================================
-- 1. EVOLUÇÃO DA TABELA DE ESCRITÓRIOS (SaaS Logic)
-- ==========================================
ALTER TABLE public.escritorios 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'gratis',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'ativo', 'bloqueado', 'vencido')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ==========================================
-- 2. AJUSTE DE COLABORADORES PARA CONVITES
-- ==========================================
-- Garante que o e-mail do colaborador seja único por escritório (para convites)
ALTER TABLE public.colaboradores 
DROP CONSTRAINT IF EXISTS unique_email_per_office;

-- Removendo UNIQUE global do email para permitir que o mesmo e-mail teste outros escritórios (opcional)
-- Mas mantendo UNIQUE por escritório para evitar duplicados na mesma conta
ALTER TABLE public.colaboradores 
ADD CONSTRAINT unique_email_per_office UNIQUE (email, escritorio_id);

-- ==========================================
-- 3. MOTOR DE REGISTRO AUTOMÁTICO (CORAÇÃO DO SAAS)
-- ==========================================
-- Esta função cria o escritório e o perfil Master no ato do cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
  new_escritorio_id UUID;
BEGIN
  -- 1. Criar o escritório para o novo usuário
  INSERT INTO public.escritorios (nome, trial_ends_at, plano, status)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'escritorio_nome', 'Meu Novo Escritório'),
    (now() + interval '7 days'),
    'gratis',
    'trial'
  )
  RETURNING id INTO new_escritorio_id;

  -- 2. Cadastrar o usuário como o Dono (Master) deste escritório
  -- O vínculo é feito através do email para permitir convites prévios
  INSERT INTO public.colaboradores (user_id, escritorio_id, nome, email, tipo, ativo)
  VALUES (
    new.id, 
    new_escritorio_id, 
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), 
    new.email, 
    'master',
    true
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-atrelar o trigger caso ele tenha sido removido em migrations anteriores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_registration();

-- ==========================================
-- 4. FUNÇÃO DE VERIFICAÇÃO DE SAÚDE (FINANCEIRO)
-- ==========================================
-- Retorna se o escritório está apto a operar
CREATE OR REPLACE FUNCTION public.check_office_health(office_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN status = 'ativo' THEN true
      WHEN status = 'trial' AND trial_ends_at > now() THEN true
      ELSE false
    END
  FROM public.escritorios
  WHERE id = office_uuid;
$$;
