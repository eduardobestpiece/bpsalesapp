
import { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SimulatorSidebar } from './SimulatorSidebar';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { CompanyProvider } from '@/contexts/CompanyContext';

interface SimulatorLayoutProps {
  children: ReactNode;
}

export const SimulatorLayout = ({ children }: SimulatorLayoutProps) => {
  return (
    <CompanyProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulatorSidebar />
          <SidebarInset className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <SidebarTrigger />
              <span className="font-bold text-lg text-gray-800 tracking-wide">Simulador</span>
            </div>
            <main className="flex-1 p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
};
