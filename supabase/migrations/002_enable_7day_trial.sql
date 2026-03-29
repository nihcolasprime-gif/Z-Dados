-- 1. Adicionar coluna de expiração do trial na tabela perfis
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS trial_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- 2. Atualizar a função handle_new_user para garantir o trial de 7 dias no momento do cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, assinatura_ativa, trial_until)
  VALUES (new.id, new.email, false, (now() + interval '7 days'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar a trigger (re-criando para garantir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Reparo para usuários existentes: 
-- Se houver algum perfil sem trial_until (null), setar para 7 dias a partir de agora.
UPDATE public.perfis 
SET trial_until = (now() + interval '7 days') 
WHERE trial_until IS NULL;

-- 5. Dar Trial Ativo para o Proprietário (zlinemkt@gmail.com) para teste imediato
UPDATE public.perfis 
SET trial_until = (now() + interval '365 days'), -- 1 ano para o dono
    assinatura_ativa = true 
WHERE email = 'zlinemkt@gmail.com';
