import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
      <Target className="w-20 h-20 text-white/10 mb-8" />
      <h1 className="text-7xl font-bold bg-gradient-to-br from-white to-gray-600 bg-clip-text text-transparent mb-4 tracking-tighter">
        404
      </h1>
      <h2 className="text-2xl font-light mb-4 text-white/80">Ops! Você se perdeu nos autos...</h2>
      <p className="text-white/40 max-w-md mb-10 leading-relaxed font-light">
        Não conseguimos encontrar a página solicitada. O roteamento foi bloqueado por segurança ou a URL não existe mais.
      </p>
      <Link to="/dashboard/finance" className="px-8 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-full hover:bg-white hover:text-black transition-all">
        Voltar para Seu Radar
      </Link>
    </div>
  );
}
