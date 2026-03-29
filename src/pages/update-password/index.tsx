import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão inválida', { description: 'O link de recuperação expirou ou é inválido.' });
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );

      const result = await Promise.race([
        supabase.auth.updateUser({ password }),
        timeoutPromise
      ]) as { error?: { message: string } };

      if (result.error) throw new Error(result.error.message);
      
      toast.success('Senha definida!', { description: 'Entrando no painel...' });
      localStorage.removeItem('supabase.auth.token');
      
      setTimeout(() => {
        window.location.href = '/dashboard/finance';
      }, 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      const isTimeout = message === 'TIMEOUT';
      toast.error(isTimeout ? 'Servidor demorou demais' : 'Erro ao definir senha', {
        description: isTimeout 
          ? 'Tente novamente ou recarregue a página.' 
          : message,
      });
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '3.5rem', fontSize: '1rem',
    paddingLeft: '3rem', paddingRight: '1rem',
    paddingTop: '0.5rem', paddingBottom: '0.5rem',
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
    color: '#ffffff', outline: 'none', transition: 'all 0.3s',
  };

  return (
    <div className="min-h-screen text-white flex relative overflow-hidden items-center justify-center"
      style={{ background: '#050505' }}>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none z-0"
        style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none z-0"
        style={{ background: 'rgba(255,255,255,0.04)' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-lg z-10 flex flex-col items-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)', padding: '2.5rem',
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
          <Scale size={32} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Defina sua Senha</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={14} style={{ color: '#22c55e' }} />
          Crie uma senha segura para seu acesso
        </p>

        <form onSubmit={handleUpdate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="password" required placeholder="Nova senha (mín. 6 caracteres)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="password" required placeholder="Confirmar senha"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4].map(level => (
                <div key={level} style={{
                  flex: 1, height: 4, borderRadius: 2, transition: 'background 0.3s',
                  background: password.length >= level * 3
                    ? level <= 1 ? '#ef4444' : level <= 2 ? '#f59e0b' : '#22c55e'
                    : 'rgba(255,255,255,0.05)'
                }} />
              ))}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            style={{
              width: '100%', height: '3.5rem', background: '#ffffff', color: '#000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              borderRadius: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              border: 'none', cursor: (isLoading || !password || !confirmPassword) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !password || !confirmPassword) ? 0.5 : 1, marginTop: '0.5rem',
              boxShadow: '0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.3s', fontSize: '0.875rem',
            }}
          >
            {isLoading ? 'Salvando...' : 'Definir Senha e Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
