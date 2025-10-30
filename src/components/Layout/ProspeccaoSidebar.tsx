import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/ui/Logo';
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
import { Search, Instagram, Bot, LogOut } from 'lucide-react';

export const ProspeccaoSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, companyId, crmUser, signOut } = useCrmAuth();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const permissions = usePermissions();

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
  });

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
    if (visibleCompanies.length > 0) {
      if (!selectedCompanyId || !visibleCompanies.some((c: any) => c.id === selectedCompanyId)) {
        setSelectedCompanyId(visibleCompanies[0].id);
      }
    }
  }, [visibleCompanies, selectedCompanyId, setSelectedCompanyId]);

  const isActivePath = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/crm/login';
  };

  const handleLogoClick = () => {
    navigate('/prospeccao');
  };

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
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Prospecção</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Google Scrapper */}
              {permissions.canAccessGestao && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/prospeccao/google')}>
                    <Link to="/prospeccao/google">
                      <Search className="h-4 w-4" />
                      <span>Google Scrapper</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {/* Instagram Scrapper */}
              {permissions.canAccessGestao && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/prospeccao/instagram')}>
                    <Link to="/prospeccao/instagram">
                      <Instagram className="h-4 w-4" />
                      <span>Instagram Scrapper</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {/* IA Scrapper */}
              {permissions.canAccessGestao && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActivePath('/prospeccao/ia')}>
                    <Link to="/prospeccao/ia">
                      <Bot className="h-4 w-4" />
                      <span>IA Scrapper</span>
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
