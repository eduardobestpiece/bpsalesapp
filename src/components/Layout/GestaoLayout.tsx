import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { GestaoSidebar } from './GestaoSidebar';
import { useModule } from '@/contexts/ModuleContext';
import { ModuleSwitcher } from './ModuleSwitcher';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface GestaoLayoutProps {
  children: ReactNode;
}

const GestaoHeader = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isMobile = useIsMobile();
  return (
    <header
      className="flex min-h-16 shrink-0 items-center gap-4 border-b border-border dark:border-[#E50F5E]/30 px-4 bg-background dark:bg-[#1E1E1E] fixed top-0 z-40 w-full"
      style={{
        left: isMobile ? '0' : (isCollapsed ? '0' : '16rem'),
        right: '0',
        width: isMobile ? '100%' : (isCollapsed ? '100%' : 'calc(100% - 16rem)'),
        transition: 'left 0.2s ease-linear, width 0.2s ease-linear'
      }}
    >
      <SidebarTrigger className="-ml-1 text-foreground dark:text-white brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)] transition-colors" />
      <ModuleSwitcher current="gestao" />
    </header>
  );
};

export const GestaoLayout = ({ children }: GestaoLayoutProps) => {
  const { setModule } = useModule();
  const { companyId } = useCrmAuth();

  useEffect(() => { setModule('gestao'); }, [setModule]);

  return (
    <CompanyProvider defaultCompanyId={companyId || ''}>
      <SidebarProvider>
        <div className="gestao-layout min-h-screen flex w-full bg-background dark:bg-[#131313]">
          <GestaoSidebar />

          <SidebarInset className="flex-1 overflow-x-hidden pt-1 w-full">
            <GestaoHeader />
            <main className="flex-1 p-6 bg-background dark:bg-[#131313] max-w-full mt-16">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
};


