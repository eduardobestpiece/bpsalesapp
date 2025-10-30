import { ReactNode } from 'react';
import { ProspeccaoSidebar } from './ProspeccaoSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface ProspeccaoLayoutProps {
  children: ReactNode;
}

export const ProspeccaoLayout = ({ children }: ProspeccaoLayoutProps) => {
  return (
    <SidebarProvider>
      <ProspeccaoSidebar />
      <SidebarInset>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
