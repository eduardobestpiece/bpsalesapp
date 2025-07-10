
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

export const CrmSidebar = () => {
  const location = useLocation();
  const { userRole, companyId } = useCrmAuth();
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

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <Link to="/crm" className="flex items-center space-x-3">
          <div className="bg-gradient-primary p-2 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-primary">Monteo CRM</h1>
            <span className="text-xs text-secondary/60 font-medium">Sistema de Gestão</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActivePath('/crm/perfil')}>
                  <Link to="/crm/perfil">
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {(userRole === 'admin' || userRole === 'master') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/crm/configuracoes')}>
                    <Link to="/crm/configuracoes">
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {userRole === 'master' && (
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

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <ThemeSwitch />
          <CrmUserMenu pagePermissions={pagePermissions} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
