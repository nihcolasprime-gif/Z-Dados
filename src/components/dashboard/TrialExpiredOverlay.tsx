import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CreditCard, MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TrialExpiredOverlay: React.FC = () => {
  const { isTrialExpired, role } = useAuth();

  if (!isTrialExpired) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel p-8 max-w-lg w-full text-center border-secondary/30 shadow-2xl shadow-secondary/10"
      >
        <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6 text-secondary animate-pulse text-3xl">
          <Lock size={40} />
        </div>

        <h2 className="text-3xl font-serif text-white mb-4 uppercase tracking-[0.2em]">
          Período de Teste <span className="text-secondary">Expirado</span>
        </h2>
        
        <p className="text-muted mb-8 leading-relaxed">
          Sua jornada de 7 dias no <strong className="text-white">Legal OS</strong> chegou ao fim. 
          Sua conta e dados estão protegidos, mas para continuar operando na teia jurídica, 
          é necessário ativar um plano.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {role === 'master' ? (
            <>
              <button 
                className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-lg font-bold group"
                onClick={() => window.open('https://wa.me/seunumerosaas', '_blank')}
              >
                <CreditCard size={20} /> ATIVAR PLANO AGORA <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-outline w-full py-4 flex items-center justify-center gap-3 text-white/60">
                <MessageCircle size={20} /> FALAR COM CONSULTOR
              </button>
            </>
          ) : (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80 text-sm">
                Acesso restrito. Por favor, entre em contato com o <strong className="text-secondary text-sm">Administrador do seu Escritório</strong> para regularizar o acesso da equipe.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[10px] text-muted uppercase tracking-widest">
            Z Dados • Tecnologia para Advocacia de Elite
          </p>
        </div>
      </motion.div>
    </div>
  );
};
