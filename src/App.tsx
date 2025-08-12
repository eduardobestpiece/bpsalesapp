
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { CrmAuthProvider, useCrmAuth } from "@/contexts/CrmAuthContext";
import { ProtectedRoute } from "@/components/CRM/ProtectedRoute";
import { CrmLayout } from "@/components/Layout/CrmLayout";
import { SimulatorLayout } from "@/components/Layout/SimulatorLayout";
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
import { Loader2 } from "lucide-react";

// Novas páginas do módulo Configurações
import SettingsSimulator from "./pages/settings/SettingsSimulator";
import SettingsCrm from "./pages/settings/SettingsCrm";
import SettingsUsers from "./pages/settings/SettingsUsers";
import SettingsMaster from "./pages/settings/SettingsMaster";
import SettingsEmpresa from "./pages/settings/SettingsEmpresa";
import SettingsPerfil from "./pages/settings/SettingsPerfil";
import SettingsAgendamento from "./pages/settings/SettingsAgendamento";

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
          {/* Public routes */}
          <Route path="/crm/login" element={
            user ? (crmUser ? <Navigate to="/home" replace /> : <CrmLogin />) : <CrmLogin />
          } />
          <Route path="/crm/redefinir-senha-convite" element={<CrmResetPasswordInvite />} />
          <Route path="/crm/redefinir-senha" element={<CrmResetPassword />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            user ? <Navigate to="/home" replace /> : <Navigate to="/crm/login" replace />
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

          {/* Novo módulo: Configurações */}
          <Route path="/configuracoes/simulador" element={
            user ? <SettingsSimulator /> : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/crm" element={
            user ? (
              <SettingsCrm />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/usuarios" element={
            user ? (
              <SettingsUsers />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/empresa" element={
            user ? (
              <SettingsEmpresa />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/master" element={
            user ? (
              <ProtectedRoute requiredRole="master">
                <SettingsMaster />
              </ProtectedRoute>
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/perfil" element={
            user ? (
              <SettingsPerfil />
            ) : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes/agendamento" element={
            user ? (
              <SettingsAgendamento />
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
