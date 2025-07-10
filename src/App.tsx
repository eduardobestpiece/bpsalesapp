
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { CrmAuthProvider } from "@/contexts/CrmAuthContext";
import { ProtectedRoute } from "@/components/CRM/ProtectedRoute";
import { CrmLayout } from "@/components/Layout/CrmLayout";
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
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function CrmLoginRedirect() {
  const { user, loading } = useCrmAuth();
  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;
  return <CrmLogin />;
}

function ProtectedPage({ pageKey, children }: { pageKey: string, children: React.ReactNode }) {
  const { userRole, companyId, loading } = useCrmAuth();
  const [allowed, setAllowed] = useState<boolean>(true);
  useEffect(() => {
    if (!companyId || !userRole) return;
    supabase
      .from('role_page_permissions')
      .select('allowed')
      .eq('company_id', companyId)
      .eq('role', userRole)
      .eq('page', pageKey)
      .single()
      .then(({ data }) => {
        if (data && data.allowed === false) setAllowed(false);
        else setAllowed(true);
      });
  }, [companyId, userRole, pageKey]);
  if (loading) return null;
  if (!allowed) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

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
                    {/* Redirecionar root para login se não autenticado, senão para /home */}
                    <Route path="/" element={<ProtectedRoute><Navigate to="/home" replace /></ProtectedRoute>} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    
                    {/* Rota do simulador com layout */}
                    <Route path="/simulador" element={<ProtectedRoute><ProtectedPage pageKey="simulator"><Simulador /></ProtectedPage></ProtectedRoute>} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    
                    {/* Rota de login do CRM */}
                    <Route path="/crm/login" element={<CrmLoginRedirect />} />
                    <Route path="/crm/redefinir-senha-convite" element={<CrmResetPasswordInvite />} />
                    <Route path="/crm/redefinir-senha" element={<CrmResetPassword />} />
                    
                    {/* Rotas protegidas do CRM com layout */}
                    <Route 
                      path="/crm" 
                      element={
                        <ProtectedRoute>
                          <ProtectedPage pageKey="comercial">
                            <CrmLayout>
                              <CrmDashboard />
                            </CrmLayout>
                          </ProtectedPage>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/configuracoes" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <CrmLayout>
                            <CrmConfiguracoes />
                          </CrmLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/indicadores" 
                      element={
                        <ProtectedRoute>
                          <ProtectedPage pageKey="indicadores">
                            <CrmLayout>
                              <CrmIndicadores />
                            </CrmLayout>
                          </ProtectedPage>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/perfil" 
                      element={
                        <ProtectedRoute>
                          <CrmLayout>
                            <CrmPerfil />
                          </CrmLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/crm/master" 
                      element={
                        <ProtectedRoute requiredRole="master">
                          <CrmLayout>
                            <CrmMasterConfig />
                          </CrmLayout>
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
