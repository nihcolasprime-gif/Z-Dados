import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlassLayout } from './components/Layout/GlassLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/login';
import Configuracoes from './pages/Configuracoes';
import NotFound from './pages/NotFound';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Lazy-loaded dashboard modules
const FinanceiroPage = lazy(() => import('./pages/dashboard/finance'));
const ClientesPage = lazy(() => import('./pages/dashboard/clientes'));
const CRMPage = lazy(() => import('./pages/dashboard/crm'));
const AtendimentosPage = lazy(() => import('./pages/dashboard/atendimentos'));
const ConsultasPage = lazy(() => import('./pages/dashboard/consultas'));
const ContratosPage = lazy(() => import('./pages/dashboard/contratos'));
const ColaboradoresPage = lazy(() => import('./pages/dashboard/colaboradores'));
const RelatoriosPage = lazy(() => import('./pages/dashboard/relatorios'));
const UpdatePassword = lazy(() => import('./pages/update-password'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

function DashboardLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <span className="text-muted text-sm tracking-widest uppercase">Carregando módulo...</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<Suspense fallback={<DashboardLoadingFallback />}><UpdatePassword /></Suspense>} />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <GlassLayout>
                  <Suspense fallback={<DashboardLoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="finance" replace />} />
                      <Route path="finance" element={<FinanceiroPage />} />
                      <Route path="clientes" element={<ClientesPage />} />
                      <Route path="crm" element={<CRMPage />} />
                      <Route path="atendimentos" element={<AtendimentosPage />} />
                      <Route path="consultas" element={<ConsultasPage />} />
                      <Route path="contratos" element={<ContratosPage />} />
                      <Route path="colaboradores" element={<ColaboradoresPage />} />
                      <Route path="relatorios" element={<RelatoriosPage />} />
                      <Route path="configuracoes" element={<Configuracoes />} />
                      <Route path="*" element={<Navigate to="/not-found" />} />
                    </Routes>
                  </Suspense>
                </GlassLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
