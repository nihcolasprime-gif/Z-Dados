import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthStatus() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);

      // Verifica se a assinatura está ativa no banco
      const { data, error } = await supabase
        .from('perfis')
        .select('assinatura_ativa')
        .eq('id', session.user.id)
        .single();

      if (!error && data?.assinatura_ativa) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
      
      setLoading(false);
    }
    
    checkAuthStatus();

    // Opcional: Escutar mudanças de Auth State em tempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
       if (!session) {
         setIsAuthenticated(false);
         setHasAccess(false);
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
