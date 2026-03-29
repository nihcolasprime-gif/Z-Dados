import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function Topbar() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring', delay: 0.1 }}
      className="h-20 w-full liquid-panel flex items-center justify-between px-6 z-40 relative"
    >
      <div className="flex items-center gap-4 w-96 relative">
        <Search className="absolute left-3 text-white/40" size={18} />
        <input 
          type="text" 
          placeholder="Pesquisar processos, clientes..." 
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/30 backdrop-blur-md"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 hover:text-white">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
        </button>
      </div>
    </motion.header>
  );
}
