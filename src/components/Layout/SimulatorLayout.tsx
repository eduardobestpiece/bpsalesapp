
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
        <div className="min-h-screen flex w-full bg-background dark:bg-[#131313]">
          <SimulatorSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border dark:border-[#A86F57]/20 px-4 bg-background dark:bg-[#1E1E1E] sticky top-0 z-50">
              <SidebarTrigger className="-ml-1 text-foreground dark:text-white" />
              <ThemeSwitch />
              <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-gray-300 bg-muted/50 dark:bg-[#A86F57]/10 px-3 py-1.5 rounded-full">
                <span className="font-medium">Faça a sua simulação</span>
              </div>
            </header>
            <main className="flex-1 p-6 bg-background dark:bg-[#131313]">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
};
