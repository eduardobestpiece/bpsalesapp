
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { CrmAuthProvider, useCrmAuth } from "@/contexts/CrmAuthContext";
import { ProtectedRoute } from "@/components/CRM/ProtectedRoute";
import { CrmLayout } from "@/components/Layout/CrmLayout";
import { SimulatorLayout } from "@/components/Layout/SimulatorLayout";
import { SettingsLayout } from "@/components/Layout/SettingsLayout";
import Index from "./pages/Index";
import Simulador from "./pages/Simulador";
// import Configuracoes from "./pages/Configuracoes"; // removido: agora em módulo próprio
import CrmLogin from "./pages/crm/CrmLogin";
import CrmDashboard from "./pages/crm/CrmDashboard";
// import CrmConfiguracoes from "./pages/crm/CrmConfiguracoes"; // removido: agora em módulo próprio
import CrmIndicadores from "./pages/crm/CrmIndicadores";
import CrmPerfil from "./pages/crm/CrmPerfil";
// import CrmMasterConfig from "./pages/crm/CrmMasterConfig"; // acessado apenas via módulo Configurações
import NotFound from "./pages/NotFound";
import CrmResetPasswordInvite from "./pages/crm/CrmResetPasswordInvite";
import CrmResetPassword from "./pages/crm/CrmResetPassword";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import VideoPage from "./pages/VideoPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import { Loader2 } from "lucide-react";

// Novas páginas do módulo Configurações
import SettingsSimulator from "./pages/settings/SettingsSimulator";
import SettingsCrm from "./pages/settings/SettingsCrm";
import SettingsGestao from "./pages/settings/SettingsGestao";
import SettingsUsers from "./pages/settings/SettingsUsers";
import SettingsMaster from "./pages/settings/SettingsMaster";
import SettingsEmpresa from "./pages/settings/SettingsEmpresa";
import SettingsPerfil from "./pages/settings/SettingsPerfil";


const queryClient = new QueryClient();

function AppContent() {
  const { user, crmUser, companyId, loading } = useCrmAuth();
  
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
          <Route path="/video" element={<VideoPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          
          {/* Public routes */}
          <Route path="/crm/login" element={
            user ? (crmUser ? <Navigate to="/home" replace /> : <CrmLogin />) : <CrmLogin />
          } />
          <Route path="/crm/redefinir-senha-convite" element={<CrmResetPasswordInvite />} />
          <Route path="/crm/redefinir-senha" element={<CrmResetPassword />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            user ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />
          } />
          <Route path="/home" element={
            user ? <Home /> : <Navigate to="/crm/login" replace />
          } />
          <Route path="/simulador" element={
            user ? (
              <ProtectedRoute requiredPageKey="simulator">
                <Simulador />
              </ProtectedRoute>
            ) : <Navigate to="/crm/login" replace />
          } />

          {/* Configurações do Simulador agora dentro do módulo Simulador */}
          <Route path="/simulador/configuracoes" element={
            user ? (
              <ProtectedRoute requiredPageKey="simulator_config">
                <SettingsSimulator />
              </ProtectedRoute>
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
          
          {/* Redirecionamentos das páginas antigas para a nova página de Gestão */}
          <Route path="/configuracoes/perfil" element={<Navigate to="/configuracoes/gestao" replace />} />
          <Route path="/configuracoes/empresa" element={<Navigate to="/configuracoes/gestao" replace />} />
          <Route path="/configuracoes/usuarios" element={<Navigate to="/configuracoes/gestao" replace />} />
          
          <Route path="/configuracoes/crm" element={
            user ? (
              <SettingsLayout>
              <SettingsCrm />
              </SettingsLayout>
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/master" element={
            user ? (
              <ProtectedRoute requiredRole="master">
                <SettingsLayout>
                <SettingsMaster />
                </SettingsLayout>
              </ProtectedRoute>
            ) : <Navigate to="/crm/login" replace />
          } />

          
          {/* CRM Routes */}
          <Route path="/crm" element={
            user ? (
              <CrmLayout>
                <CrmDashboard />
              </CrmLayout>
            ) : <Navigate to="/crm/login" replace />
          } />
          {/* Antigas rotas de configurações e master do CRM foram removidas */}
          <Route path="/crm/indicadores" element={
            user ? (
              <CrmLayout>
                <CrmIndicadores />
              </CrmLayout>
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/crm/perfil" element={
            user ? (
              <CrmLayout>
                <CrmPerfil />
              </CrmLayout>
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
        <ModuleProvider>
          <CrmAuthProvider>
            <Toaster />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </CrmAuthProvider>
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
