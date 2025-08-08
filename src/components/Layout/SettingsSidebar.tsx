
import { Settings, SlidersHorizontal, Users, Building2, Shield, ChevronDown, LogOut } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/Logo';

export const SettingsSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [pagePermissions, setPagePermissions] = useState<any>({});

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
    if (!companyId || !userRole) return;
    supabase
      .from('role_page_permissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', userRole as any)
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

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/crm/login';
  };

  const handleLogoClick = () => {
    navigate('/configuracoes/simulador');
  };

  const goToSimulator = () => navigate('/simulador');
  const goToCrm = () => navigate('/crm/indicadores');
  const goToSettings = () => navigate('/configuracoes/simulador');

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-start">
          <Logo onClick={handleLogoClick} className="h-10 w-auto max-w-[140px] mb-2" />
          <span className="font-bold text-lg text-foreground tracking-wide mb-4">Configurações</span>
          {userRole === 'master' && (
            <div className="w-full mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Empresa</label>
              <select
                className="w-full p-2 border border-input bg-background text-foreground rounded text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
              <button className="flex items-center justify-between w-full p-2 text-sm bg-muted rounded-md hover:bg-muted/80 transition-colors text-foreground">
                <span>Módulo</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={goToSimulator}>Simulador</DropdownMenuItem>
              <DropdownMenuItem onClick={goToCrm}>CRM</DropdownMenuItem>
              <DropdownMenuItem onClick={goToSettings}>Configurações</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActivePath('/configuracoes/simulador')}>
                  <Link to="/configuracoes/simulador">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Simulador</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(userRole === 'admin' || userRole === 'master') && (pagePermissions['crm_config'] !== false) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/configuracoes/crm')}>
                    <Link to="/configuracoes/crm">
                      <Settings className="h-4 w-4" />
                      <span>CRM</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(userRole === 'admin' || userRole === 'master') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/configuracoes/usuarios')}>
                    <Link to="/configuracoes/usuarios">
                      <Users className="h-4 w-4" />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(userRole === 'admin' || userRole === 'master') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/configuracoes/empresa')}>
                    <Link to="/configuracoes/empresa">
                      <Building2 className="h-4 w-4" />
                      <span>Empresa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {userRole === 'master' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/configuracoes/master')}>
                    <Link to="/configuracoes/master">
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
          <div>
            <Avatar>
              <AvatarImage src={crmUser?.avatar_url || undefined} alt={crmUser?.first_name || 'Usuário'} />
              <AvatarFallback>{(crmUser?.first_name?.[0] || 'U')}{(crmUser?.last_name?.[0] || '')}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-sm truncate">{crmUser?.first_name || 'Usuário'} {crmUser?.last_name || ''}</span>
            <span className="text-xs text-muted-foreground truncate">{crmUser?.email || 'sem-email'}</span>
          </div>
          <button className="ml-2 p-2 rounded hover:bg-destructive/10 transition-colors" onClick={handleLogout} title="Sair">
            <LogOut className="h-5 w-5 text-destructive" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}; 