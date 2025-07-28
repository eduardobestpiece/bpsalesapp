
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
import Configuracoes from "./pages/Configuracoes";
import CrmLogin from "./pages/crm/CrmLogin";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmConfiguracoes from "./pages/crm/CrmConfiguracoes";
import CrmIndicadores from "./pages/crm/CrmIndicadores";
import CrmPerfil from "./pages/crm/CrmPerfil";
import CrmMasterConfig from "./pages/crm/CrmMasterConfig";
import NotFound from "./pages/NotFound";
import CrmResetPasswordInvite from "./pages/crm/CrmResetPasswordInvite";
import CrmResetPassword from "./pages/crm/CrmResetPassword";
import Home from "./pages/Home";
import { Loader2 } from "lucide-react";

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

  // Fallback global para usuário autenticado mas não encontrado no CRM
  if (user && !crmUser && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Usuário não encontrado no CRM</h2>
          <p className="text-secondary/60">Seu usuário está autenticado, mas não foi localizado na base de usuários do CRM. Contate o administrador do sistema.</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/crm/login" element={
            user ? <Navigate to="/home" replace /> : <CrmLogin />
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
            user ? <Simulador /> : <Navigate to="/crm/login" replace />
          } />
          <Route path="/configuracoes" element={
            user ? <Configuracoes /> : <Navigate to="/crm/login" replace />
          } />
          <Route path="/simulador/master" element={
            user ? (
              <ProtectedRoute requiredRole="master">
                <SimulatorLayout>
                  <CrmMasterConfig />
                </SimulatorLayout>
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
          <Route path="/crm/configuracoes" element={
            user ? (
              <ProtectedRoute requiredRole="admin">
                <CrmLayout>
                  <CrmConfiguracoes />
                </CrmLayout>
              </ProtectedRoute>
            ) : <Navigate to="/crm/login" replace />
          } />
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
          <Route path="/crm/master" element={
            user ? (
              <ProtectedRoute requiredRole="master">
                <CrmLayout>
                  <CrmMasterConfig />
                </CrmLayout>
              </ProtectedRoute>
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
