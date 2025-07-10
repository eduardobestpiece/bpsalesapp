
import { Users, BarChart3, Settings, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { CrmUserMenu } from './CrmUserMenu';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { useModule } from '@/contexts/ModuleContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export const CrmSidebar = () => {
  const location = useLocation();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const { currentModule, setModule } = useModule();
  const [pagePermissions, setPagePermissions] = useState<any>({});

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from('role_page_permissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', userRole)
      .then(({ data }) => {
        const perms: any = {};
        data?.forEach((row: any) => {
          perms[row.page] = row.allowed;
        });
        setPagePermissions(perms);
      });
  }, [companyId, userRole]);

  const isActivePath = (path: string) => location.pathname === path;

  const handleAvatarClick = () => {
    window.location.href = '/crm/perfil';
  };
  const handleLogout = async () => {
    await signOut();
    window.location.href = '/crm/login';
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 flex flex-col items-center">
        <img src="/favicon.ico" alt="Logo Monteo" className="h-10 w-10 mb-2" />
        <span className="font-bold text-lg text-gray-800 tracking-wide">MONTEO</span>
        <span className="text-xs text-secondary/60 font-medium mb-2">INVESTIMENTOS</span>
      </SidebarHeader>
      <SidebarContent>
        {/* Seletor de módulo */}
        <div className="flex justify-center mb-4">
          {pagePermissions['indicadores'] !== false && (
            <button
              className={`px-3 py-1 rounded-l-lg border ${currentModule === 'crm' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              onClick={() => setModule('crm')}
            >Indicadores</button>
          )}
          {pagePermissions['simulator'] !== false && (
            <button
              className={`px-3 py-1 rounded-r-lg border-l-0 border ${currentModule === 'simulator' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              onClick={() => setModule('simulator')}
            >Simulador</button>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pagePermissions['indicadores'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/crm/indicadores')}>
                    <Link to="/crm/indicadores">
                      <BarChart3 className="h-4 w-4" />
                      <span>Indicadores</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {pagePermissions['comercial'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/crm')}>
                    <Link to="/crm">
                      <Users className="h-4 w-4" />
                      <span>Comercial</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(userRole === 'admin' || userRole === 'master') && pagePermissions['crm_config'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/crm/configuracoes')}>
                    <Link to="/crm/configuracoes">
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {userRole === 'master' && pagePermissions['crm_master'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/crm/master')}>
                    <Link to="/crm/master">
                      <Shield className="h-4 w-4" />
                      <span>Master Config</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="cursor-pointer" onClick={handleAvatarClick}>
            <Avatar>
              <AvatarImage src={crmUser?.avatar_url || undefined} alt={crmUser?.first_name || 'Usuário'} />
              <AvatarFallback>{(crmUser?.first_name?.[0] || 'U')}{(crmUser?.last_name?.[0] || '')}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-sm truncate">{crmUser?.first_name || 'Usuário'} {crmUser?.last_name || ''}</span>
            <span className="text-xs text-secondary/60 truncate">{crmUser?.email || 'sem-email'}</span>
          </div>
          <button className="ml-2 p-2 rounded hover:bg-red-50" onClick={handleLogout} title="Sair">
            <LogOut className="h-5 w-5 text-red-500" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
