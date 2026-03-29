import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Scale, LogOut, CheckSquare, Stethoscope, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navGroups = [
  {
    label: '',
    items: [
      { path: '/dashboard/finance', label: 'Overview', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Operacional',
    items: [
      { path: '/dashboard/atendimentos', label: 'Atendimentos', icon: CheckSquare },
      { path: '/dashboard/crm', label: 'CRM', icon: Users },
    ]
  },
  {
    label: 'Jurídico',
    items: [
      { path: '/dashboard/clientes', label: 'Clientes', icon: Users },
      { path: '/dashboard/consultas', label: 'Consultas', icon: Stethoscope },
      { path: '/dashboard/contratos', label: 'Contratos', icon: FileText },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { path: '/dashboard/colaboradores', label: 'Colaboradores', icon: Users },
      { path: '/dashboard/relatorios', label: 'Relatórios', icon: FileText },
    ]
  }
];

export function Sidebar({ profile = {} as any, email = 'admin@zdados.com' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="w-64 h-screen fixed left-0 top-0 liquid-panel z-50 flex flex-col p-4 m-4"
    >
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-lg backdrop-blur-md">
          <Scale size={20} />
        </div>
        <div className="text-xl font-bold tracking-widest text-white/90">
          Z <span className="text-white/50 font-light">DADOS</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-6 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            {group.label && (
              <h3 className="text-[0.65rem] font-black uppercase text-white/30 tracking-widest px-4 mb-2">
                {group.label}
              </h3>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/10 backdrop-blur-md translate-x-1' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'opacity-100' : 'opacity-70'} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-white/50" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="text-sm font-semibold text-white/90 truncate">{profile?.nome || 'Advogado'}</p>
             <p className="text-xs text-white/40 truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm font-medium"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </motion.aside>
  );
}
