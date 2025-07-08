
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModuleProvider } from "@/contexts/ModuleContext";
import Index from "./pages/Index";
import Configuracoes from "./pages/Configuracoes";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmConfiguracoes from "./pages/crm/CrmConfiguracoes";
import CrmIndicadores from "./pages/crm/CrmIndicadores";
import CrmPerformance from "./pages/crm/CrmPerformance";
import CrmPerfil from "./pages/crm/CrmPerfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ModuleProvider>
          <Toaster />
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <main>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="/crm" element={<CrmDashboard />} />
                  <Route path="/crm/configuracoes" element={<CrmConfiguracoes />} />
                  <Route path="/crm/indicadores" element={<CrmIndicadores />} />
                  <Route path="/crm/performance" element={<CrmPerformance />} />
                  <Route path="/crm/perfil" element={<CrmPerfil />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
