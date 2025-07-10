
import { Calculator, TrendingUp, Settings, User, Users, LogOut } from 'lucide-react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useModule } from '@/contexts/ModuleContext';

export const SimulatorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
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
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pagePermissions['simulator'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/simulador')}>
                    <Link to="/simulador">
                      <Calculator className="h-4 w-4" />
                      <span>Simulador</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {pagePermissions['simulator_config'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/configuracoes')}>
                    <Link to="/configuracoes">
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

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
