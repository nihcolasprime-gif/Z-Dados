import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Colaborador, Escritorio } from '../models';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Colaborador | null;
  role: string | null;
  escritorioId: string | null;
  escritorio: Escritorio | null;
  isTrialExpired: boolean;
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
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userObj: User) => {
    try {
      const { data } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('email', userObj.email)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setEscritorioId(data.escritorio_id);
        // Garante que master continue master, e associado/colaborador vire collaborator para a UI
        const userRole = data.tipo === 'master' ? 'master' : 'collaborator';
        setRole(userRole);

        // Buscar Saúde do Escritório (Trial/Plano)
        const { data: escData } = await supabase
          .from('escritorios')
          .select('*')
          .eq('id', data.escritorio_id)
          .maybeSingle();

        if (escData) {
          setEscritorio(escData);
          const trialExpired = escData.status === 'vencido' || 
                             (escData.status === 'trial' && new Date(escData.trial_ends_at) < new Date());
          setIsTrialExpired(trialExpired);
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
        await fetchProfile(newUser);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setEscritorioId(null);
        setEscritorio(null);
        setIsTrialExpired(false);
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
    <AuthContext.Provider value={{ session, user, profile, escritorioId, escritorio, isTrialExpired, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
