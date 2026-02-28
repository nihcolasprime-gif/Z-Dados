import IAProspeccao from './pages/IAProspeccao';

function App() {
  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] bg-indigo-600/20 animate-blob pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[120px] bg-sky-500/10 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[130px] bg-purple-600/20 animate-blob animation-delay-4000 pointer-events-none" />

      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay z-0" />

      <main className="relative z-10 w-full h-full min-h-screen flex flex-col">
        <IAProspeccao />
      </main>
    </div>
  );
}

export default App;