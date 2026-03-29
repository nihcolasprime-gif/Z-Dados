import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AguardandoAprovacao() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
        <ShieldCheck className="w-16 h-16 text-yellow-500/80 mx-auto mb-6" />

        <h1 className="text-2xl font-light mb-4 text-[#e2e2e2] tracking-wide">
          Verificando Pagamento
        </h1>
        
        <p className="text-white/50 mb-8 font-light leading-relaxed">
          Recebemos o seu cadastro! Seu painel será desbloqueado automaticamente assim que a InfinitePay confirmar o processamento da sua assinatura.
        </p>
        
        <div className="flex flex-col gap-4">
          <button 
             className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
             onClick={() => window.location.reload()}
          >
            Atualizar Status
          </button>
          <Link to="/login" className="text-sm text-yellow-500/60 hover:text-yellow-400 transition-colors">
            Fazer logoff
          </Link>
        </div>
      </div>
      
      <div className="fixed bottom-6 text-xs text-white/30 flex gap-4 uppercase tracking-widest">
        <span>Termos de Uso</span>
        <span>&bull;</span>
        <span>Privacidade (LGPD)</span>
      </div>
    </div>
  );
}
