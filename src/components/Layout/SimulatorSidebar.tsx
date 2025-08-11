
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
import { Logo } from '@/components/ui/Logo';

export const SimulatorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const [pagePermissions, setPagePermissions] = useState<any>({});
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();

  // Buscar empresas (sempre habilitar; RLS controla visibilidade)
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
    enabled: true,
  });

  // Empresas às quais o usuário pertence (por email)
  const { data: userCompanyIds = [] } = useQuery({
    queryKey: ['user_company_ids', crmUser?.email],
    enabled: !!crmUser?.email && userRole !== 'master',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_users')
        .select('company_id')
        .eq('email', crmUser?.email as string);
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r: any) => r.company_id).filter(Boolean)));
      return ids as string[];
    }
  });

  const visibleCompanies = userRole === 'master'
    ? companies
    : (userCompanyIds.length > 0
        ? companies.filter((c: any) => userCompanyIds.includes(c.id))
        : companies.filter((c: any) => c.id === (companyId || crmUser?.company_id)));

  // Branding
  const currentCompanyId = selectedCompanyId || companyId;
  const { data: branding } = useQuery({
    queryKey: ['company_branding', currentCompanyId],
    enabled: !!currentCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('logo_horizontal_url, logo_horizontal_dark_url, primary_color, secondary_color, border_radius_px')
        .eq('company_id', currentCompanyId)
        .maybeSingle();
      return data as { logo_horizontal_url?: string; logo_horizontal_dark_url?: string; primary_color?: string; secondary_color?: string; border_radius_px?: number } | null;
    },
  });

  useEffect(() => {
    if (branding?.primary_color) {
      const hex = branding.primary_color;
      document.documentElement.style.setProperty('--brand-primary', hex);
      const m = hex.replace('#','');
      const r = parseInt(m.substring(0,2),16);
      const g = parseInt(m.substring(2,4),16);
      const b = parseInt(m.substring(4,6),16);
      document.documentElement.style.setProperty('--brand-rgb', `${r}, ${g}, ${b}`);
    }
    if (branding?.secondary_color) {
      const hex = branding.secondary_color;
      document.documentElement.style.setProperty('--brand-secondary', hex);
      const m = hex.replace('#','');
      const r = parseInt(m.substring(0,2),16);
      const g = parseInt(m.substring(2,4),16);
      const b = parseInt(m.substring(4,6),16);
      document.documentElement.style.setProperty('--brand-secondary-rgb', `${r}, ${g}, ${b}`);
    }
    if (typeof branding?.border_radius_px === 'number') {
      document.documentElement.style.setProperty('--brand-radius', `${branding.border_radius_px}px`);
    }
  }, [branding?.primary_color]);

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
    if (visibleCompanies.length > 0) {
      if (!selectedCompanyId || !visibleCompanies.some((c: any) => c.id === selectedCompanyId)) {
        setSelectedCompanyId(visibleCompanies[0].id);
      }
    }
  }, [visibleCompanies, selectedCompanyId, setSelectedCompanyId]);

  const isActivePath = (path: string) => location.pathname === path;

  const handleGoToCrm = () => {
    navigate('/crm/indicadores');
  };

  const handleUserFooterClick = () => {
    navigate('/configuracoes/perfil');
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

  // Páginas de settings para checagem agregada
  const { data: settingsPageKeys = [] } = useQuery({
    queryKey: ['app_pages_settings_keys_sidebar_sim'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_pages')
        .select('key')
        .eq('module', 'settings');
      return (data || []).map((r: any) => r.key as string);
    }
  });
  const canSeeSettingsModule = (settingsPageKeys.length > 0 && settingsPageKeys.some(k => pagePermissions[k] !== false)) || userRole === 'admin' || userRole === 'master';

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex flex-col items-start">
          {branding?.logo_horizontal_url ? (
            <Logo
              onClick={handleLogoClick}
              className="h-10 w-auto max-w-[140px] mb-2"
              lightUrl={branding?.logo_horizontal_url || null}
              darkUrl={branding?.logo_horizontal_dark_url || branding?.logo_horizontal_url || null}
              alt="Logo da empresa"
            />
          ) : (
            <Logo onClick={handleLogoClick} className="h-10 w-auto max-w-[140px] mb-2" />
          )}
          {/* Seletor de empresa: sempre para master, ou quando usuário possui 2+ empresas visíveis */}
          {(userRole === 'master' || visibleCompanies.length > 1) && (
            <div className="w-full mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Empresa</label>
              <select
                className="w-full p-2 border border-input bg-background text-foreground rounded text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedCompanyId || ''}
                onChange={e => setSelectedCompanyId(e.target.value)}
                disabled={companiesLoading}
              >
                {visibleCompanies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* removido: seletor de módulo no sidebar (agora no header) */}
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
              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="cursor-pointer" onClick={handleUserFooterClick} title="Meu Perfil">
            <Avatar>
              <AvatarImage src={crmUser?.avatar_url || undefined} alt={crmUser?.first_name || 'Usuário'} />
              <AvatarFallback>{(crmUser?.first_name?.[0] || 'U')}{(crmUser?.last_name?.[0] || '')}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={handleUserFooterClick} title="Meu Perfil">
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
