
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ModuleProvider } from "@/contexts/ModuleContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Simulador from "./pages/Simulador";
import Administrators from "./pages/Administrators";
import MasterConfig from "./pages/MasterConfig";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

// CRM Pages
import CrmLogin from "./pages/crm/CrmLogin";
import CrmResetPassword from "./pages/crm/CrmResetPassword";
import CrmResetPasswordInvite from "./pages/crm/CrmResetPasswordInvite";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmIndicadores from "./pages/crm/CrmIndicadores";
import CrmConfiguracoes from "./pages/crm/CrmConfiguracoes";
import CrmMasterConfig from "./pages/crm/CrmMasterConfig";
import CrmPerfil from "./pages/crm/CrmPerfil";
import CrmPerformance from "./pages/crm/CrmPerformance";

import { CrmAuthProvider } from "./contexts/CrmAuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ProtectedRoute } from "./components/CRM/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <ModuleProvider>
            <CrmAuthProvider>
              <CompanyProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/simulador" element={<Simulador />} />
                    <Route path="/administrators" element={<Administrators />} />
                    <Route path="/master-config" element={<MasterConfig />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    
                    {/* CRM Routes */}
                    <Route path="/crm/login" element={<CrmLogin />} />
                    <Route path="/crm/reset-password" element={<CrmResetPassword />} />
                    <Route path="/crm/reset-password-invite" element={<CrmResetPasswordInvite />} />
                    
                    <Route
                      path="/crm/dashboard"
                      element={
                        <ProtectedRoute>
                          <CrmDashboard />
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
                    <Route
                      path="/crm/configuracoes"
                      element={
                        <ProtectedRoute>
                          <CrmConfiguracoes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/master-config"
                      element={
                        <ProtectedRoute>
                          <CrmMasterConfig />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/perfil"
                      element={
                        <ProtectedRoute>
                          <CrmPerfil />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/performance"
                      element={
                        <ProtectedRoute>
                          <CrmPerformance />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CompanyProvider>
            </CrmAuthProvider>
          </ModuleProvider>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
