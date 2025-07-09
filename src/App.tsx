
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { CrmAuthProvider } from "@/contexts/CrmAuthContext";
import { ProtectedRoute } from "@/components/CRM/ProtectedRoute";
import Index from "./pages/Index";
import Configuracoes from "./pages/Configuracoes";
import CrmLogin from "./pages/crm/CrmLogin";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmConfiguracoes from "./pages/crm/CrmConfiguracoes";
import CrmIndicadores from "./pages/crm/CrmIndicadores";
import CrmPerformance from "./pages/crm/CrmPerformance";
import CrmPerfil from "./pages/crm/CrmPerfil";
import CrmMasterConfig from "./pages/crm/CrmMasterConfig";
import NotFound from "./pages/NotFound";
import CrmResetPasswordInvite from "./pages/crm/CrmResetPasswordInvite";
import CrmResetPassword from "./pages/crm/CrmResetPassword";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ModuleProvider>
          <CrmAuthProvider>
            <Toaster />
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <main>
                  <Routes>
                    {/* Rotas principais */}
                    <Route path="/" element={<Index />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    
                    {/* Rota de login do CRM */}
                    <Route path="/crm/login" element={<CrmLogin />} />
                    <Route path="/crm/redefinir-senha-convite" element={<CrmResetPasswordInvite />} />
                    <Route path="/crm/redefinir-senha" element={<CrmResetPassword />} />
                    
                    {/* Rotas protegidas do CRM */}
                    <Route 
                      path="/crm" 
                      element={
                        <ProtectedRoute>
                          <CrmDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/configuracoes" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <CrmConfiguracoes />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/indicadores" 
                      element={
                        <ProtectedRoute>
                          <CrmIndicadores />
                        </ProtectedRoute>
                      } 
                    />
                    {/* Rota Performance removida */}
                    <Route 
                      path="/crm/perfil" 
                      element={
                        <ProtectedRoute>
                          <CrmPerfil />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/master" 
                      element={
                        <ProtectedRoute requiredRole="master">
                          <CrmMasterConfig />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </CrmAuthProvider>
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
