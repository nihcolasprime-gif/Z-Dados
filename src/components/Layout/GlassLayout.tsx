import { BottomNav } from './BottomNav';
import { motion } from 'framer-motion';

export function GlassLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative overflow-hidden">
      <BottomNav />

      {/* Main Content — offset for sidebar on desktop (280px), bottom nav on mobile */}
      <div className="flex-1 w-full md:ml-[260px] lg:ml-[280px] flex flex-col pt-6 md:pt-8 px-4 md:px-8 lg:px-10 xl:px-12 pb-28 md:pb-8 min-h-screen overflow-y-auto custom-scrollbar z-10">
        <motion.main className="max-w-[1600px] w-full mx-auto">
          {children}
        </motion.main>
      </div>

      {/* Low-Light Ambient Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
    </div>
  );
}
