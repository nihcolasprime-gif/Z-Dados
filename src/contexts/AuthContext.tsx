import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Colaborador } from '../models';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Colaborador | null;
  role: string | null;
  escritorioId: string | null;
  hasAccess: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Colaborador | null>(null);
  const [escritorioId, setEscritorioId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userObj: User) => {
    try {
      // Busca dados de colaborador e dados de assinatura (perfis) em paralelo
      const [colaboradorRes, perfilRes] = await Promise.all([
        supabase.from('colaboradores').select('*').eq('email', userObj.email).maybeSingle(),
        supabase.from('perfis').select('assinatura_ativa, trial_until').eq('id', userObj.id).maybeSingle()
      ]);

      if (colaboradorRes.data) {
        setProfile(colaboradorRes.data);
        setEscritorioId(colaboradorRes.data.escritorio_id);
        const userRole = colaboradorRes.data.tipo === 'associado' ? 'collaborator' : colaboradorRes.data.tipo;
        setRole(userRole);
      }

      // Bypass do Proprietário: Liberação instantânea
      if (userObj.email?.toLowerCase() === 'zlinemkt@gmail.com') {
        setHasAccess(true);
      }

      if (perfilRes.data) {
        const now = new Date();
        const trialUntil = perfilRes.data.trial_until ? new Date(perfilRes.data.trial_until) : null;
        const isTrialValid = trialUntil ? trialUntil > now : false;
        
        if (userObj.email?.toLowerCase() === 'zlinemkt@gmail.com') {
          setHasAccess(true);
        } else {
          setHasAccess(perfilRes.data.assinatura_ativa || isTrialValid);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar perfil completo:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Timer de emergência para destravar o loading após 5 segundos
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ AUTH TIMEOUT: Destravando interface após 5s.');
        setLoading(false);
      }
    }, 5000);

    const initialize = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        if (error) throw error;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await fetchProfile(initialSession.user);
        }
      } catch (err) {
        console.error('Erro na inicialização da Auth:', err);
      } finally {
        if (isMounted) {
          clearTimeout(fallbackTimer);
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      
      if (newUser) {
        if (newUser.email?.toLowerCase() === 'zlinemkt@gmail.com') {
          setHasAccess(true);
        }
        await fetchProfile(newUser);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setEscritorioId(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, escritorioId, role, hasAccess, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
