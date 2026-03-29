import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BentoBoxProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  delay?: number;
}

// Princípio de "Divulgação Progressiva" e "Redução da Carga Cognitiva"
export function BentoBox({ title, subtitle, children, icon, className = '', delay = 0 }: BentoBoxProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`liquid-panel p-5 sm:p-6 flex flex-col gap-3 group relative overflow-hidden ${className}`}
    >
      {(title || icon) && (
        <div className="flex justify-between items-start z-10 relative">
          <div className="flex-1">
            {subtitle && <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">{subtitle}</p>}
            {title && <h3 className="text-white/90 font-bold text-sm tracking-wide">{title}</h3>}
          </div>
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 border border-white/10 group-hover:text-white group-hover:bg-white/10 transition-colors">
              {icon}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 z-10 relative">
        {children}
      </div>

      {/* Low-Light Aesthetic Accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
    </motion.div>
  );
}
