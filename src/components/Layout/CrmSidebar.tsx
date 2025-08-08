
import { Users, BarChart3, Settings, Shield, ChevronDown } from 'lucide-react';
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
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/Logo';

export const CrmSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [pagePermissions, setPagePermissions] = useState<any>({});

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

  // Branding da empresa atual/selecionada
  const currentCompanyId = selectedCompanyId || companyId;
  const { data: branding } = useQuery({
    queryKey: ['company_branding', currentCompanyId],
    enabled: !!currentCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('logo_horizontal_url, logo_horizontal_dark_url')
        .eq('company_id', currentCompanyId)
        .maybeSingle();
      return data as { logo_horizontal_url?: string; logo_horizontal_dark_url?: string } | null;
    },
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

  const handleAvatarClick = () => {
    window.location.href = '/crm/perfil';
  };

  const handleLogout = async () => {
    await signOut();
    // Redireciona para a página de login do CRM após logout
    window.location.href = '/crm/login';
  };

  const handleGoToSimulator = () => {
    navigate('/simulador');
  };

  const handleGoToIndicators = () => {
    navigate('/crm/indicadores');
  };

  const handleLogoClick = () => {
    navigate('/crm/indicadores');
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-start">
          {branding?.logo_horizontal_url ? (
            <img
              src={document?.documentElement?.classList?.contains('dark') && branding.logo_horizontal_dark_url ? branding.logo_horizontal_dark_url : branding.logo_horizontal_url}
              onClick={handleLogoClick}
              className="h-10 w-auto max-w-[140px] mb-2 cursor-pointer object-contain"
              alt="Logo"
            />
          ) : (
            <Logo onClick={handleLogoClick} className="h-10 w-auto max-w-[140px] mb-2" />
          )}
          <span className="font-bold text-lg text-foreground tracking-wide mb-4">CRM</span>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between w-full p-2 text-sm bg-muted rounded-md hover:bg-muted/80 transition-colors text-foreground">
                <span>Módulo</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {pagePermissions['simulator'] !== false && (
                <DropdownMenuItem onClick={handleGoToSimulator}>
                  Simulador
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleGoToIndicators}>
                CRM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes/simulador')}>
                Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
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
          <div className="flex col flex-1 min-w-0">
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
