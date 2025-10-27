
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { CrmAuthProvider, useCrmAuth } from "@/contexts/CrmAuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { SimulatorLayout } from "@/components/Layout/SimulatorLayout";
import { SettingsLayout } from "@/components/Layout/SettingsLayout";
import Index from "./pages/Index";
import Simulador from "./pages/Simulador";
// import Configuracoes from "./pages/Configuracoes"; // removido: agora em módulo próprio
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import VideoPage from "./pages/VideoPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import LandingTeste from "./pages/LandingTeste";
import GestaoLeadsNew from "./pages/gestao/LeadsNew";
import GestaoAgendamentos from "./pages/gestao/Agendamentos";
import GestaoVendas from "./pages/gestao/Vendas";
import { Loader2 } from "lucide-react";

// Novas páginas do módulo Configurações
import SettingsSimulator from "./pages/settings/SettingsSimulator";
// Removido: SettingsCrm por exclusão do módulo CRM
import SettingsGestao from "./pages/settings/SettingsGestao";
import SettingsUsers from "./pages/settings/SettingsUsers";
import SettingsMaster from "./pages/settings/SettingsMaster";
import SettingsEmpresa from "./pages/settings/SettingsEmpresa";
import SettingsPerfil from "./pages/settings/SettingsPerfil";
import SettingsForms from "./pages/settings/SettingsForms";
import SettingsFields from "./pages/settings/SettingsFields";
import PublicForm from "./pages/PublicForm";
import IframeGeneratorPage from "./pages/IframeGeneratorPage";
import { TestPermissions } from "./components/TestPermissions";
import { DebugPermissions } from "./components/DebugPermissions";
import { DebugTabPermissions } from "./components/DebugTabPermissions";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Removido: Módulo Marketing
// Removido: Páginas e layouts do CRM (Dashboard, Indicadores, Leads, Perfil, Layout)

// Nova página de Login genérica
import Login from "./pages/Login";
import UserSetup from "./pages/UserSetup";

// Hook para gerenciar cores globais
import { useGlobalColors } from "@/hooks/useGlobalColors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Componente para aplicar cores globais
function GlobalColorsProvider({ children }: { children: React.ReactNode }) {
  useGlobalColors(); // Aplica as cores globais automaticamente
  return <>{children}</>;
}

function AppContent() {
  const { user, crmUser, companyId, loading, userRole } = useCrmAuth();
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary/60">Carregando...</p>
        </div>
      </div>
    );
  }

  
  // Removido: tela bloqueante de "Usuário não encontrado no CRM"
  // O caso de usuário autenticado mas sem crmUser será tratado na tela de login
  
  // Fallback global para usuário sem empresa associada
  if (user && crmUser && !companyId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Empresa não associada</h2>
          <p className="text-secondary/60">Seu usuário não está associado a nenhuma empresa ativa. Contate o administrador do sistema.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Routes>
          {/* Landing Pages */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/landing-teste" element={<LandingTeste />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          
          {/* Public Form - accessible without authentication */}
          <Route path="/form/:formId" element={<PublicForm />} />
          
          {/* Iframe Generator - accessible without authentication */}
          <Route path="/iframe-generator" element={<IframeGeneratorPage />} />
          
          {/* Public routes */}
          <Route path="/crm/login" element={
            user ? (crmUser ? <Navigate to="/home" replace /> : <Login />) : <Login />
          } />
          <Route path="/user-setup" element={
            user ? <UserSetup /> : <Navigate to="/crm/login" replace />
          } />
          {/* Removidas: rotas de redefinição de senha dentro de /crm */}
          
          {/* Protected routes */}
          <Route path="/" element={
            user ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />
          } />
          <Route path="/home" element={
            user ? <Home /> : <Navigate to="/crm/login" replace />
          } />
          <Route path="/simulador" element={
            user ? (
              <ProtectedRoute requiredModule="simulator">
                <Simulador />
              </ProtectedRoute>
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Novo módulo: Gestão */}
          <Route path="/gestao" element={
            user ? (
              <GestaoLeadsNew />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/gestao/leads" element={
            user ? (
              <GestaoLeadsNew />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/gestao/agendamentos" element={
            user ? (
              <GestaoAgendamentos />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/gestao/vendas" element={
            user ? (
              <GestaoVendas />
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Configurações do Simulador agora dentro do módulo Simulador */}
          <Route path="/simulador/configuracoes" element={
            user ? (
              <SettingsSimulator />
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Novo módulo: Configurações */}
          {/* Rota antiga redireciona para o novo local */}
          <Route path="/configuracoes/simulador" element={<Navigate to="/simulador/configuracoes" replace />} />
          
          {/* Nova página unificada de Gestão */}
          <Route path="/configuracoes/gestao" element={
            user ? (
              <SettingsLayout>
                <SettingsGestao />
              </SettingsLayout>
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Nova página: Formulários */}
          <Route path="/configuracoes/formularios" element={
            user ? (
              <SettingsLayout>
                <SettingsForms />
              </SettingsLayout>
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Nova página: Campos */}
          <Route path="/configuracoes/campos" element={
            user ? (
              <SettingsLayout>
                <SettingsFields />
              </SettingsLayout>
            ) : <Navigate to="/crm/login" replace />
          } />
          
          {/* Redirecionamentos das páginas antigas para a nova página de Gestão */}
          <Route path="/configuracoes/perfil" element={<Navigate to="/configuracoes/gestao" replace />} />
          <Route path="/configuracoes/empresa" element={<Navigate to="/configuracoes/gestao" replace />} />
          <Route path="/configuracoes/usuarios" element={<Navigate to="/configuracoes/gestao" replace />} />
          
          {/* Removida: página de configurações do CRM */}
          
          <Route path="/configuracoes/master" element={
            user ? (
              userRole === 'master' ? (
                <SettingsLayout>
                  <SettingsMaster />
                </SettingsLayout>
              ) : <Navigate to="/configuracoes/gestao" replace />
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Removidas: rotas do CRM e do Marketing */}
          
          {/* Rota temporária para testar permissões */}
          <Route path="/test-permissions" element={
            user ? (
              <div className="container mx-auto p-6">
                <TestPermissions />
              </div>
            ) : <Navigate to="/crm/login" replace />
          } />
          
          {/* Rota temporária para debug de permissões */}
          <Route path="/debug-permissions" element={
            user ? (
              <div className="container mx-auto p-6">
                <DebugPermissions />
              </div>
            ) : <Navigate to="/crm/login" replace />
          } />
          
          {/* Rota temporária para debug de permissões das abas */}
          <Route path="/debug-tab-permissions" element={
            user ? (
              <div className="container mx-auto p-6">
                <DebugTabPermissions />
              </div>
            ) : <Navigate to="/crm/login" replace />
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CompanyProvider>
          <ModuleProvider>
            <CrmAuthProvider>
              <GlobalColorsProvider>
                <Toaster />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </GlobalColorsProvider>
            </CrmAuthProvider>
          </ModuleProvider>
        </CompanyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
