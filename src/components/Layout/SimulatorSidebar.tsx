
import { Calculator, TrendingUp, Settings, User, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { UserMenu } from './UserMenu';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';

export const SimulatorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleGoToCrm = () => {
    navigate('/crm/indicadores');
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <Link to="/simulador" className="flex items-center space-x-3">
          <div className="bg-gradient-primary p-2 rounded-xl shadow-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-primary">Monteo</h1>
            <span className="text-xs text-secondary/60 font-medium">Simulador Financeiro</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActivePath('/simulador')}>
                  <Link to="/simulador">
                    <Calculator className="h-4 w-4" />
                    <span>Simulador</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActivePath('/configuracoes')}>
                  <Link to="/configuracoes">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {pagePermissions['indicadores'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleGoToCrm}>
                    <span className="flex items-center cursor-pointer">
                      <Users className="h-4 w-4" />
                      <span>CRM</span>
                    </span>
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
          <UserMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
