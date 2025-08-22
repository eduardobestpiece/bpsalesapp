
import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CrmSidebar } from './CrmSidebar';
// import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { ModuleSwitcher } from './ModuleSwitcher';

interface CrmLayoutProps {
  children: ReactNode;
}

export const CrmLayout = ({ children }: CrmLayoutProps) => {
  return (
    <CompanyProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background dark:bg-[#131313]">
          <CrmSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border dark:border-[#A86F57]/20 px-4 bg-background dark:bg-[#1E1E1E]">
              <SidebarTrigger className="-ml-1 text-foreground dark:text-white brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)] transition-colors" />
              {/* <ThemeSwitch /> */}
              <ModuleSwitcher current="crm" />
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
