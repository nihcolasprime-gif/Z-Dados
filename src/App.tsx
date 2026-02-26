import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Empresa from './pages/Empresa';
import Guide from './pages/Guide';
import Dashboard from './pages/Dashboard';
import { Database, Home as HomeIcon, BarChart3 } from 'lucide-react';

function TopNav() {
  const location = useLocation();
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-6 py-3 flex gap-8 items-center border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
      <Link
        to="/"
        className={`flex items-center gap-2 font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-white/50 hover:text-white'}`}
      >
        <HomeIcon className="w-4 h-4" /> Principal
      </Link>
      <Link
        to="/guide"
        className={`flex items-center gap-2 font-medium transition-colors ${location.pathname === '/guide' ? 'text-white' : 'text-white/50 hover:text-white'}`}
      >
        <Database className="w-4 h-4" /> Como Funciona
      </Link>
      <Link
        to="/dashboard"
        className={`flex items-center gap-2 font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-white' : 'text-white/50 hover:text-white'}`}
      >
        <BarChart3 className="w-4 h-4" /> Dashboard
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden font-sans">

        {/* Immersive Deep Tech Backgrounds - Liquid Glass & Neon Globs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] bg-indigo-600/20 animate-blob pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[120px] bg-sky-500/10 animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[130px] bg-purple-600/20 animate-blob animation-delay-4000 pointer-events-none" />

        {/* Dynamic Scanline Grid for Spatial Tech feel */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay z-0"></div>

        <TopNav />

        <main className="relative z-10 w-full h-full min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/empresa/:cnpj" element={<Empresa />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
