
import { Calculator, Settings, Users, LogOut, ChevronDown } from 'lucide-react';
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

export const SimulatorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const [pagePermissions, setPagePermissions] = useState<any>({});
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();

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

  const handleGoToCrm = () => {
    navigate('/crm/indicadores');
  };

  const handleAvatarClick = () => {
    window.location.href = '/crm/perfil';
  };

  const handleLogout = async () => {
    await signOut();
    // Redireciona para a página de login do CRM após logout
    window.location.href = '/crm/login';
  };

  const handleStayInSimulator = () => {
    navigate('/simulador');
  };

  const handleLogoClick = () => {
    navigate('/simulador');
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-start">
          <Logo onClick={handleLogoClick} className="h-10 w-auto max-w-[140px] mb-2" />
          <span className="font-bold text-lg text-foreground tracking-wide mb-4">Simulador</span>
          {/* Seletor de empresa para Master */}
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
          {/* Dropdown de módulo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between w-full p-2 text-sm bg-muted rounded-md hover:bg-muted/80 transition-colors text-foreground">
                <span>Módulo</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={handleStayInSimulator}>
                Simulador
              </DropdownMenuItem>
              {pagePermissions['indicadores'] !== false && (
                <DropdownMenuItem onClick={handleGoToCrm}>
                  CRM
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
              {/* Master Config: visível apenas para master */}
              {userRole === 'master' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/master-config')}>
                    <Link to="/master-config">
                      <Settings className="h-4 w-4" />
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
