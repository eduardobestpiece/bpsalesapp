
import { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SimulatorSidebar } from './SimulatorSidebar';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';

interface SimulatorLayoutProps {
  children: ReactNode;
}

export const SimulatorLayout = ({ children }: SimulatorLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SimulatorSidebar />
        <SidebarInset className="flex-1">
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
