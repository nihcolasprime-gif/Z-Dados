import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Tenta pegar a sessão rapidamente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);

        // Busca o perfil (assinatura/trial)
        const { data, error: profileError } = await supabase
          .from('perfis')
          .select('assinatura_ativa, trial_until')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao carregar perfil:', profileError);
          // Em caso de erro de rede, podemos ser mais permissivos ou restritos. 
          // Aqui, tentamos acesso zero se falhar totalmente.
          setHasAccess(false);
        } else {
          const isTrialActive = data?.trial_until ? new Date(data.trial_until) > new Date() : false;
          setHasAccess(data?.assinatura_ativa || isTrialActive);
        }
      } catch (err) {
        console.error('Erro crítico na Proteção de Rota:', err);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthStatus();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
       if (event === 'SIGNED_OUT' || !session) {
         setIsAuthenticated(false);
         setHasAccess(false);
         setLoading(false);
       }
    });

    return () => {
       authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
       </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  return <>{children}</>;
}
