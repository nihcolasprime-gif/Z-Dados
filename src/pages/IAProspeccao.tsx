import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchIAProspeccao, type IAProspeccaoResponse } from '../lib/api';

export default function IAProspeccao() {
  const [pergunta, setPergunta] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IAProspeccaoResponse | null>(null);
  const [buscou, setBuscou] = useState(false);

  const resultadosFormatados = useMemo(() => {
    if (!resultado) {
      return [];
    }

    return resultado.resultados.slice(0, 20).map((item, index) => ({
      id: `r-${index}`,
      texto: JSON.stringify(item),
    }));
  }, [resultado]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const perguntaLimpa = pergunta.trim();

    if (!perguntaLimpa) {
      return;
    }

    setBuscou(true);
    setCarregando(true);
    setErro(null);

    try {
      const data = await fetchIAProspeccao(perguntaLimpa);
      setResultado(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Erro inesperado ao buscar dados.';
      setResultado(null);
      setErro(message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center transition-all duration-700">
      <div
        className={`w-full max-w-4xl mx-auto px-4 z-10 transition-all duration-700 ease-in-out ${
          buscou ? 'transform mt-20' : 'transform translate-y-[-10vh]'
        }`}
      >
        <div className="text-center mb-8 sm:mb-12 pt-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            Z <span className="text-gradient">Dados</span>
          </h1>
          <p className="text-zinc-400 text-base md:text-xl font-medium max-w-2xl mx-auto px-4 opacity-80">
            Intelig�ncia de mercado e dados p�blicos de empresas do Brasil em milissegundos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/30 to-blue-500/20 rounded-3xl blur-md opacity-50" />
          <div className="relative flex items-center glass-panel p-2">
            <div className="pl-4 pr-3 text-white/50">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={pergunta}
              onChange={(event) => setPergunta(event.target.value)}
              placeholder="Digite sua pergunta de prospec��o..."
              className="w-full bg-transparent border-none text-white text-lg focus:outline-none py-4"
            />
            <div className="flex items-center gap-2 pr-2">
              <button type="submit" className="glass-button-primary px-6 md:px-8 py-3" disabled={carregando}>
                {carregando ? 'Buscando...' : 'Pesquisar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {buscou && (
        <div className="z-10 w-full px-4 pb-20 mt-8">
          <div className="w-full max-w-5xl mx-auto glass-card p-6 md:p-8">
            {erro && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                <p className="font-semibold">Falha na consulta</p>
                <p className="text-sm mt-1">{erro}</p>
              </div>
            )}

            {!erro && resultado && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Resposta da IA</h2>
                  <p className="text-zinc-300 mt-2 leading-relaxed">{resultado.resposta}</p>
                </div>

                {resultado.fontes.length > 0 && (
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-semibold">Fontes</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {resultado.fontes.map((fonte) => (
                        <span key={fonte} className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-200">
                          {fonte}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {resultadosFormatados.length > 0 && (
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-zinc-400 font-semibold">Resultados</h3>
                    <div className="mt-3 space-y-2">
                      {resultadosFormatados.map((item) => (
                        <pre key={item.id} className="text-xs p-3 rounded-xl bg-black/30 border border-white/10 overflow-x-auto text-zinc-200">
                          {item.texto}
                        </pre>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!erro && !resultado && carregando && (
              <div className="animate-pulse text-zinc-300">Consultando backend...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}