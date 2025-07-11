
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCrmAuth();
  const location = useLocation();
  
  console.log('[AuthGuard] Current path:', location.pathname, 'User:', !!user, 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Se não está autenticado e não está na página de login, redireciona
  if (!user && location.pathname !== '/crm/login' && !location.pathname.startsWith('/crm/redefinir-senha')) {
    return <Navigate to="/crm/login" replace />;
  }
  
  // Se está autenticado e está na página de login, redireciona para home
  if (user && location.pathname === '/crm/login') {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

function ProtectedPage({ pageKey, children }: { pageKey: string, children: React.ReactNode }) {
  const { userRole, companyId, loading } = useCrmAuth();
  const [allowed, setAllowed] = useState<boolean>(true);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    if (!companyId || !userRole) {
      setCheckingPermissions(false);
      return;
    }

    supabase
      .from('role_page_permissions')
      .select('allowed')
      .eq('company_id', companyId)
      .eq('role', userRole)
      .eq('page', pageKey)
      .single()
      .then(({ data }) => {
        if (data && data.allowed === false) {
          setAllowed(false);
        } else {
          setAllowed(true);
        }
        setCheckingPermissions(false);
      });
  }, [companyId, userRole, pageKey]);

  if (loading || checkingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/home" replace />;
  }

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
              <AuthGuard>
                <div className="min-h-screen bg-gray-50">
                  <main>
                    <Routes>
                      {/* Redirecionar root para home se autenticado */}
                      <Route path="/" element={<Navigate to="/home" replace />} />
                      <Route path="/home" element={<Home />} />
                      
                      {/* Rota do simulador */}
                      <Route path="/simulador" element={
                        <ProtectedPage pageKey="simulator">
                          <Simulador />
                        </ProtectedPage>
                      } />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      
                      {/* Rota de login do CRM */}
                      <Route path="/crm/login" element={<CrmLogin />} />
                      <Route path="/crm/redefinir-senha-convite" element={<CrmResetPasswordInvite />} />
                      <Route path="/crm/redefinir-senha" element={<CrmResetPassword />} />
                      
                      {/* Rotas protegidas do CRM com layout */}
                      <Route path="/crm" element={
                        <ProtectedPage pageKey="comercial">
                          <CrmLayout>
                            <CrmDashboard />
                          </CrmLayout>
                        </ProtectedPage>
                      } />
                      <Route path="/crm/configuracoes" element={
                        <ProtectedRoute requiredRole="admin">
                          <CrmLayout>
                            <CrmConfiguracoes />
                          </CrmLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/crm/indicadores" element={
                        <ProtectedPage pageKey="indicadores">
                          <CrmLayout>
                            <CrmIndicadores />
                          </CrmLayout>
                        </ProtectedPage>
                      } />
                      <Route path="/crm/perfil" element={
                        <CrmLayout>
                          <CrmPerfil />
                        </CrmLayout>
                      } />
                      <Route path="/crm/master" element={
                        <ProtectedRoute requiredRole="master">
                          <CrmLayout>
                            <CrmMasterConfig />
                          </CrmLayout>
                        </ProtectedRoute>
                      } />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </AuthGuard>
            </BrowserRouter>
          </CrmAuthProvider>
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
