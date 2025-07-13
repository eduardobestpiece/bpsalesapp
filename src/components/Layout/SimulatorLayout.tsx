
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SimulatorSidebar } from './SimulatorSidebar';
import { Header } from './Header';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CompanyProvider } from '@/contexts/CompanyContext';

export const SimulatorLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <CompanyProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulatorSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b bg-white flex items-center px-4 gap-4">
              <SidebarTrigger />
              <Header />
            </header>
            <main className="flex-1 overflow-auto">
              {children || <Outlet />}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
};
