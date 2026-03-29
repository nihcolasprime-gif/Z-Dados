import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // 1. Pega a sessão (sequencial para evitar conflitos de lock)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (!session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);

        // 2. Busca o perfil apenas se tiver sessão
        const { data: profile, error: profileError } = await supabase
          .from('perfis')
          .select('assinatura_ativa, trial_until')
          .eq('id', session.user.id)
          .single();

        if (!isMounted) return;

        if (profileError) {
          console.error('Erro de perfil:', profileError);
          setHasAccess(false);
        } else {
          const now = new Date();
          const trialUntil = profile?.trial_until ? new Date(profile.trial_until) : null;
          const isTrialValid = trialUntil ? trialUntil > now : false;
          
          setHasAccess(profile?.assinatura_ativa || isTrialValid);
        }
      } catch (err) {
        console.error('Erro na verificação de acesso:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setIsAuthenticated(false);
          setHasAccess(false);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
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
