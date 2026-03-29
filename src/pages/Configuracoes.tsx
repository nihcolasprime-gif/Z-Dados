import { ShieldAlert, UploadCloud } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto pb-24 md:pb-0">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">
            Ajustes <span className="font-bold">Z Dados</span>
          </h1>
          <p className="text-white/40 text-sm mt-1 tracking-wide">Preferências e Conformidade Jurídica</p>
        </div>
      </div>

      <div className="liquid-panel p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md">
        <h2 className="text-lg font-medium mb-6 text-gray-200 flex items-center gap-2">
          Habilidade White-label
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Nome de Exibição do Escritório</label>
            <input 
              type="text" 
              placeholder="Ex: Cardoso & Associados" 
              className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Logomarca nos Relatórios Preditivos</label>
            <div className="flex items-center gap-4">
               <div className="w-20 h-20 bg-black/30 rounded-2xl flex items-center justify-center text-white/30 border border-dashed border-white/10">
                 <UploadCloud className="w-8 h-8" />
               </div>
               <div>
                  <button className="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/80 transition-colors text-sm">Upload de Nova Imagem</button>
                  <p className="text-xs text-white/30 mt-2">Formatos: PNG transparente (Max: 2MB)</p>
               </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-white/10">
          <h2 className="text-lg font-medium text-red-400 mb-3 flex items-center gap-2">
             <ShieldAlert className="w-5 h-5" /> Regras de Conformidade (LGPD)
          </h2>
          <p className="text-sm text-white/40 mb-6 font-light leading-relaxed">
            Seus dados são encriptados no trânsito e no repouso (Supabase). Caso deseje encerrar a parceria, a exclusão da conta é definitiva e destruirá irreversivelmente qualquer histórico.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-medium">
              Excluir Instância da Empresa
            </button>
            <a href="https://infinitepay.io" target="_blank" rel="noreferrer" className="text-sm text-white/40 hover:text-white underline underline-offset-4 transition-colors">
              Pausar Assinatura na InfinitePay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
