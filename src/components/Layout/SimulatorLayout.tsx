
import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SimulatorSidebar } from './SimulatorSidebar';

interface SimulatorLayoutProps {
  children: ReactNode;
}

export const SimulatorLayout = ({ children }: SimulatorLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SimulatorSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center space-x-2 text-sm text-secondary/70 bg-primary-50/70 px-3 py-1.5 rounded-full">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="font-medium">Simule sua alavancagem</span>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
