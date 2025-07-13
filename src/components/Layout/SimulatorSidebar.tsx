
import { Users, BarChart3, Settings, Shield, ChevronDown, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const SimulatorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [pagePermissions, setPagePermissions] = useState<any>({});
  const { collapsed } = useSidebar();

  // Buscar empresas (apenas para master)
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'master',
  });

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

  useEffect(() => {
    if (userRole === 'master' && companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [userRole, companies, selectedCompanyId, setSelectedCompanyId]);

  const isActivePath = (path: string) => location.pathname === path;

  const handleAvatarClick = () => {
    window.location.href = '/crm/perfil';
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/crm/login';
  };

  const handleGoToCrm = () => {
    navigate('/crm/indicadores');
  };

  const handleGoToIndicators = () => {
    navigate('/crm/indicadores');
  };

  const handleLogoClick = () => {
    navigate('/simulador');
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible>
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-start">
          <div className="cursor-pointer mb-2" onClick={handleLogoClick}>
            {!collapsed && (
              <img src="/monteo_policromia_horizontal (1).png" alt="Logo Monteo" className="h-10 w-auto max-w-[140px]" />
            )}
          </div>
          {!collapsed && (
            <>
              <span className="font-bold text-lg text-gray-800 tracking-wide mb-4">Simulador</span>
              
              {/* Seletor de empresa para Master */}
              {userRole === 'master' && (
                <div className="w-full mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={selectedCompanyId || ''}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                    disabled={companiesLoading}
                  >
                    {companies.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full p-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <span>Módulo</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={handleGoToCrm}>
                    CRM
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Simulador
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
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
                      <BarChart3 className="h-4 w-4" />
                      {!collapsed && <span>Simulador</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {pagePermissions['simulator_config'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/configuracoes')}>
                    <Link to="/configuracoes">
                      <Settings className="h-4 w-4" />
                      {!collapsed && <span>Configurações</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {userRole === 'master' && pagePermissions['master_config'] !== false && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/crm/master')}>
                    <Link to="/crm/master">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Master Config</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {!collapsed && (
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
      )}
    </Sidebar>
  );
};
