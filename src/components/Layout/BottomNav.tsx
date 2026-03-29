import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, Briefcase, FileText, Scale,
  MessageSquare, PieChart, Settings,
  LayoutDashboard, Plus, FileSignature
} from 'lucide-react';

const navItems = [
  { path: '/dashboard/finance', icon: DollarSign, label: 'Financeiro' },
  { path: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { path: '/dashboard/crm', icon: Briefcase, label: 'CRM' },
  { path: '/dashboard/contratos', icon: Scale, label: 'Contratos' },
  { path: '/dashboard/consultas', icon: MessageSquare, label: 'Consultas' },
  { path: '/dashboard/atendimentos', icon: FileText, label: 'Atendimentos' },
  { path: '/dashboard/documentos', icon: FileSignature, label: 'Documentos' },
  { path: '/dashboard/equipe', icon: Users, label: 'Minha Equipe' },
  { path: '/dashboard/relatorios', icon: PieChart, label: 'Relatórios' },
];

const mobileNavItems = [
  { path: '/dashboard/finance', icon: DollarSign, label: 'Finance' },
  { path: '/dashboard/contratos', icon: Scale, label: 'Contratos' },
  { path: '/dashboard/equipe', icon: Users, label: 'Equipe' },
  { path: '/dashboard/relatorios', icon: PieChart, label: 'Mais' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <>
      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-24 right-6 z-50 md:hidden">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-shadow duration-300"
        >
          <Plus size={24} strokeWidth={3} />
        </motion.button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-20 bg-background/80 backdrop-blur-2xl border-t border-glassBorder z-40 flex items-center justify-around px-2 pb-safe md:hidden">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                isActive ? 'text-white' : 'text-white/30 hover:text-white/70'
              }`}
            >
              <motion.div
                animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div 
                   layoutId="activeNav"
                   className="w-1 h-1 bg-white rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR — Full navigation with labels + section
         ═══════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[260px] lg:w-[280px] flex-col bg-black/60 backdrop-blur-xl border-r border-white/[0.04] z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Z
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wider leading-none">Z DADOS</h1>
            <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mt-0.5">Legal Operations</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2 mt-2">Módulos</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'text-white bg-white/[0.08]'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="border-t border-white/[0.04] my-4" />
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2">Sistema</p>
          <Link
            to="/dashboard/configuracoes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              location.pathname.includes('configuracoes')
                ? 'text-white bg-white/[0.08]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
            }`}
          >
            <Settings size={18} strokeWidth={1.8} />
            <span>Configurações</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-4 py-5 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white/30" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium">Dashboard v2</p>
              <p className="text-white/20 text-[10px]">Vite + React</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
