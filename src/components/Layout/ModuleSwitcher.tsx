import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ModuleSwitcherProps {
  current: 'simulator' | 'crm' | 'settings';
}

export const ModuleSwitcher = ({ current }: ModuleSwitcherProps) => {
  const navigate = useNavigate();
  const { userRole, companyId, crmUser } = useCrmAuth();

  const effectiveCompanyId =
    (typeof window !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null) ||
    companyId ||
    crmUser?.company_id ||
    null;

  const { data: perms = {} } = useQuery({
    queryKey: ['role_page_permissions', effectiveCompanyId, userRole],
    enabled: !!effectiveCompanyId && !!userRole,
    queryFn: async () => {
      const { data } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', effectiveCompanyId as string)
        .eq('role', userRole as any);
      const map: Record<string, boolean> = {};
      data?.forEach((r: any) => { map[r.page] = r.allowed; });
      return map;
    }
  });

  // Buscar as páginas do módulo Configurações
  const { data: settingsPageKeys = [] } = useQuery({
    queryKey: ['app_pages_settings_keys'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_pages')
        .select('key')
        .eq('module', 'settings');
      return (data || []).map((r: any) => r.key as string);
    }
  });

  const computeSettingsPath = (): string => {
    const allowed = (key: string) => perms[key] !== false;
    
    // Verificar se já estamos em uma página de configurações
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/configuracoes/')) {
      return currentPath; // Manter na página atual
    }
    
    // Ordem de prioridade conforme solicitado:
    // 1. Gestão (unifica Meu Perfil, Empresa e Usuários)
    if (allowed('settings_profile') || allowed('settings_profile_info') || allowed('settings_profile_security') ||
        allowed('settings_company') || allowed('settings_company_data') || allowed('settings_company_branding') ||
        allowed('settings_users') || allowed('settings_users_list')) {
      return '/configuracoes/gestao';
    }
    
    // 4. CRM
    if (allowed('crm_config') || allowed('crm_config_funnels') || allowed('crm_config_sources') || allowed('crm_config_teams')) {
      return '/configuracoes/crm';
    }
    

    
    // 6. Master Config (apenas para master)
    if (userRole === 'master') {
      return '/configuracoes/master';
    }
    
    // 7. Simulador (configurações do simulador)
    if (allowed('simulator_config') || allowed('simulator_config_administrators') || allowed('simulator_config_reductions') || allowed('simulator_config_installments') || allowed('simulator_config_products') || allowed('simulator_config_leverages')) {
      return '/configuracoes/simulador';
    }
    
    // Fallback: qualquer página de configurações disponível
    if (settingsPageKeys.some(k => allowed(k))) {
      return '/configuracoes/gestao';
    }
    
    // Último fallback
    return '/configuracoes/gestao';
  };

  const computeCrmPath = (): string => {
    if (perms['indicadores'] !== false) return '/crm/indicadores';
    if (perms['comercial'] !== false) return '/crm';
    return '/crm/indicadores';
  };

  const modules = useMemo(() => {
    const allowedSettings = (
      perms['simulator_config'] !== false ||
      userRole === 'admin' || userRole === 'master'
    );

    const list: { key: 'simulator'|'crm'|'settings'; label: string; path: string; allowed: boolean }[] = [
      { key: 'simulator', label: 'Simulador', path: '/simulador', allowed: perms['simulator'] !== false },
      { key: 'crm', label: 'CRM', path: computeCrmPath(), allowed: (perms['indicadores'] !== false) || (perms['comercial'] !== false) },
      { key: 'settings', label: 'Configurações', path: computeSettingsPath(), allowed: allowedSettings },
    ];

    return list.filter(m => m.allowed);
  }, [perms, userRole, settingsPageKeys]);

  const currentLabel = modules.find(m => m.key === current)?.label || (current === 'crm' ? 'CRM' : current === 'settings' ? 'Configurações' : 'Simulador');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center space-x-2 text-sm text-foreground px-3 py-1.5 brand-radius"
          style={{ backgroundColor: 'rgba(var(--brand-secondary-rgb), 0.10)' }}
        >
          <span className="font-medium">{currentLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {modules.map(m => (
          <DropdownMenuItem
            key={m.key}
            className="dropdown-item-brand cursor-pointer"
            onClick={() => navigate(m.path)}
          >
            {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 