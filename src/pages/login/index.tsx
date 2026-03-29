import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Scale, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type LoginMode = 'login' | 'primeiro-acesso' | 'codigo-enviado';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('login');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Limpeza agressiva para evitar "Auth Locks"
      localStorage.removeItem('supabase.auth.token');
      await supabase.auth.signOut().catch(() => {});
      
      // 2. Timeout de 10 segundos para não travar o botão
      const timeout = setTimeout(() => {
        setLoading(false);
        toast.error('O sistema demorou muito para responder.', {
          description: 'A rede pode estar lenta. Tente clicar novamente.'
        });
      }, 10000);

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      clearTimeout(timeout);

      if (error) throw error;
      
      if (data?.session) {
        toast.success('Acesso liberado!');
        // 3. Força o recarregamento total para evitar conflitos de rotas
        setTimeout(() => {
          window.location.href = '/dashboard/finance';
        }, 500);
      } else {
        throw new Error('Erro ao criar sessão');
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(message === 'Invalid login credentials' 
        ? 'Credenciais incorretas.' 
        : 'Erro: ' + message);
      setLoading(false);
    }
  };

  const handlePrimeiroAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe seu e-mail corporativo.'); return; }
    setLoading(true);
    
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://z-dados.vercel.app';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/update-password`,
      });
      if (error) throw error;
      
      setMode('codigo-enviado');
      toast.success('Código enviado! Verifique seu e-mail.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Falha ao enviar o código: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex relative overflow-hidden items-center justify-center"
      style={{ background: '#050505' }}>
      {/* Ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none z-0"
        style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none z-0"
        style={{ background: 'rgba(255,255,255,0.04)' }} />
      
      <div className="w-full max-w-lg z-10 flex flex-col items-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          padding: '2.5rem',
        }}>
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 0 20px rgba(255,255,255,0.2)',
          }}>
          <Scale size={32} />
        </div>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem', textAlign: 'center' }}>
          Z <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>DADOS</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', letterSpacing: '0.05em', marginBottom: '2rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <ShieldCheck size={16} style={{ color: '#22c55e' }} />
          Terminal Jurídico Seguro
        </p>

        <AnimatePresence mode="wait">
          {/* ═══ LOGIN MODE ═══ */}
          {mode === 'login' && (
            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="email" required placeholder="E-mail Corporativo" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', height: '3.5rem', fontSize: '1rem',
                    paddingLeft: '3rem', paddingRight: '1rem',
                    paddingTop: '0.5rem', paddingBottom: '0.5rem',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
                    color: '#ffffff', outline: 'none', transition: 'all 0.3s',
                  }}
                />
              </div>
              
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="password" required placeholder="Senha de Acesso" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', height: '3.5rem', fontSize: '1rem',
                    paddingLeft: '3rem', paddingRight: '1rem',
                    paddingTop: '0.5rem', paddingBottom: '0.5rem',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
                    color: '#ffffff', outline: 'none', transition: 'all 0.3s',
                  }}
                />
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', height: '3.5rem', background: '#ffffff', color: '#000000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  borderRadius: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1, marginTop: '1rem',
                  boxShadow: '0 0 20px rgba(255,255,255,0.2)',
                  transition: 'all 0.3s', fontSize: '0.875rem',
                }}>
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                {!loading && <ArrowRight size={20} />}
              </button>

              <button type="button" onClick={() => setMode('primeiro-acesso')}
                style={{
                  width: '100%', paddingTop: '0.75rem', paddingBottom: '0.75rem',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', fontSize: '0.875rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'all 0.3s',
                }}>
                <UserPlus size={16} /> Primeiro Acesso
              </button>
            </motion.form>
          )}

          {/* ═══ PRIMEIRO ACESSO MODE ═══ */}
          {mode === 'primeiro-acesso' && (
            <motion.form key="primeiro-acesso" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePrimeiroAcesso} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <KeyRound size={24} style={{ color: 'rgba(255,255,255,0.6)' }} />
                </div>
                <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Primeiro Acesso</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Informe o e-mail cadastrado pelo administrador.<br />
                  Enviaremos um link para criar sua senha.
                </p>
              </div>

              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="email" required placeholder="Seu E-mail Corporativo" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', height: '3.5rem', fontSize: '1rem',
                    paddingLeft: '3rem', paddingRight: '1rem',
                    paddingTop: '0.5rem', paddingBottom: '0.5rem',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
                    color: '#ffffff', outline: 'none', transition: 'all 0.3s',
                  }}
                />
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', height: '3.5rem', background: '#ffffff', color: '#000000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  borderRadius: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1, marginTop: '0.5rem',
                  boxShadow: '0 0 20px rgba(255,255,255,0.2)',
                  transition: 'all 0.3s', fontSize: '0.875rem',
                }}>
                {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
                {!loading && <ArrowRight size={20} />}
              </button>

              <button type="button" onClick={() => setMode('login')}
                style={{
                  width: '100%', paddingTop: '0.75rem', paddingBottom: '0.75rem',
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem',
                  transition: 'all 0.3s',
                }}>
                ← Voltar ao Login
              </button>
            </motion.form>
          )}

          {/* ═══ CÓDIGO ENVIADO ═══ */}
          {mode === 'codigo-enviado' && (
            <motion.div key="codigo-enviado" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <Mail size={28} style={{ color: '#22c55e' }} />
              </div>
              <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700 }}>Verifique seu E-mail</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '380px' }}>
                Enviamos um link para <strong style={{ color: '#ffffff' }}>{email}</strong>.<br />
                Clique no link para definir sua senha e acessar o sistema.
              </p>
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                  💡 Não recebeu? Verifique a pasta de spam ou clique abaixo para reenviar.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                <button type="button" onClick={handlePrimeiroAcesso}
                  style={{
                    flex: 1, padding: '0.75rem', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem',
                  }}>
                  Reenviar
                </button>
                <button type="button" onClick={() => setMode('login')}
                  style={{
                    flex: 1, padding: '0.75rem', background: '#ffffff', color: '#000000',
                    border: 'none', borderRadius: '12px', fontWeight: 600,
                    cursor: 'pointer', fontSize: '0.8rem',
                  }}>
                  Voltar ao Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>Acesso monitorado e protegido por Criptografia End-to-End.</p>
        </div>
      </div>
    </div>
  );
}
