
import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { SettingsSidebar } from './SettingsSidebar';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { useModule } from '@/contexts/ModuleContext';
import { ModuleSwitcher } from './ModuleSwitcher';

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsHeader = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <header
      className="flex min-h-16 shrink-0 items-center gap-4 border-b border-border dark:border-[#A86F57]/20 px-4 bg-background dark:bg-[#1E1E1E] fixed top-0 z-40"
      style={{ left: isCollapsed ? '0' : '16rem', right: '0', transition: 'left 0.2s ease-linear' }}
    >
      <SidebarTrigger className="-ml-1 text-foreground dark:text-white" />
      <ThemeSwitch />
      <ModuleSwitcher current="settings" />
    </header>
  );
};

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const { setModule } = useModule();
  useEffect(() => { setModule('settings'); }, [setModule]);

  return (
    <CompanyProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background dark:bg-[#131313]">
          <SettingsSidebar />
          <SidebarInset className="flex-1 overflow-x-hidden pt-12">
            <SettingsHeader />
            <main className="flex-1 p-6 bg-background dark:bg-[#131313] max-w-full">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
}; 