import { Search, Building2, Phone, SlidersHorizontal, ArrowRight } from 'lucide-react';

export default function Guide() {
    return (
        <div className="relative min-h-screen pt-24 pb-12 px-4 transition-all duration-700">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white animate-in slide-in-from-bottom-8 duration-1000">
                        Como Usar o <span className="text-gradient">Z Dados</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto animate-in fade-in duration-1000 delay-150">
                        Sua plataforma definitiva para inteligência de mercado. Encontre dados públicos, contatos e informações detalhadas de qualquer empresa do Brasil de forma rápida e intuitiva.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-700 delay-300">

                    <div className="glass-card p-8 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Search className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">1. Pesquisa Direta</h3>
                        <p className="text-zinc-400 leading-relaxed max-w-sm">
                            Na tela inicial, a barra de pesquisa inteligente permite que você busque rapidamente por um <strong>CNPJ</strong>, ou pelo <strong>Nome da Empresa (Razão Social / Nome Fantasia)</strong>. Digite e aperte Enter para ver os resultados instantâneos.
                        </p>
                    </div>

                    <div className="glass-card p-8 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <SlidersHorizontal className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">2. Filtros Avançados</h3>
                        <p className="text-zinc-400 leading-relaxed max-w-sm">
                            Precisa prospectar em uma região específica? Clique no ícone de ajustes ao lado da barra de pesquisa e filtre por <strong>Estado (UF)</strong>, <strong>Cidade</strong>, <strong>CNAE (Ramo de atuação)</strong>, e até faixa de <strong>Capital Social</strong>.
                        </p>
                    </div>

                    <div className="glass-card p-8 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">3. Perfil da Empresa</h3>
                        <p className="text-zinc-400 leading-relaxed max-w-sm">
                            Ao clicar em uma empresa nos resultados, você entra no perfil detalhado. Lá você terá acesso à situação cadastral completa, data de abertura, endereço formatado e atividades secundárias.
                        </p>
                    </div>

                    <div className="glass-card p-8 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Phone className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">4. Geração de Leads</h3>
                        <p className="text-zinc-400 leading-relaxed max-w-sm">
                            Ideal para times de vendas e marketing. Obtenha acesso imediato a <strong>Telefones reais</strong> e <strong>E-mails corporativos</strong> coletados e enriquecidos, prontos para a sua equipe entrar em contato com os tomadores de decisão.
                        </p>
                    </div>

                </div>

                <div className="mt-12 mb-20">
                    <div className="glass-card p-8 text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-white/20 hover:from-indigo-500/20 hover:to-purple-500/20 cursor-pointer transition-all duration-500" onClick={() => window.location.href = '/'}>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                            Comece a Prospectar Agora <ArrowRight className="w-6 h-6" />
                        </h3>
                        <p className="text-zinc-400 max-w-xl mx-auto">
                            Volte para a página inicial e faça a sua primeira busca. Milhões de dados de empresas Brasileiras a apenas um clique de distância.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
