
import { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SimulatorSidebar } from './SimulatorSidebar';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface SimulatorLayoutProps {
  children: ReactNode;
}

export const SimulatorLayout = ({ children }: SimulatorLayoutProps) => {
  const { companyId } = useCrmAuth();
  
  return (
    <CompanyProvider defaultCompanyId={companyId || ''}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulatorSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <ThemeSwitch />
              <div className="flex items-center space-x-2 text-sm text-secondary/70 bg-blue-50/70 px-3 py-1.5 rounded-full">
                <span className="font-medium">Faça a sua simulação</span>
              </div>
            </header>
            <main className="flex-1 p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
};
