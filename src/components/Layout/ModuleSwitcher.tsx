import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCanAccessSimulator } from '@/hooks/usePermissions';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface ModuleSwitcherProps {
  current: 'simulator' | 'settings' | 'gestao' | 'prospeccao';
}

export const ModuleSwitcher = ({ current }: ModuleSwitcherProps) => {
  const navigate = useNavigate();
  const { userRole, companyId, crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  
  // Hook para verificar permissões customizadas do usuário
  const { canAccessSimulator, canAccessSimulatorConfig } = useUserPermissions();
  
  // Hook para verificar permissões do Simulador baseadas em role
  const canAccessSimulatorByRole = useCanAccessSimulator();

  // Buscar branding da empresa
  const currentCompanyId = selectedCompanyId || companyId;
  const { data: branding } = useQuery({
    queryKey: ['company_branding', currentCompanyId],
    enabled: !!currentCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('primary_color, secondary_color')
        .eq('company_id', currentCompanyId)
        .maybeSingle();
      return data;
    },
  });

  const primaryColor = branding?.primary_color || '#E50F5E';
  const secondaryColor = branding?.secondary_color || '#6B7280';

  const effectiveCompanyId =
    (typeof window !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null) ||
    companyId ||
    crmUser?.company_id ||
    null;

  const handleModuleChange = (module: string) => {
    if (module === 'simulator') {
      // Verificar permissões para decidir para onde redirecionar
      const canAccessSimulatorPage = canAccessSimulator() && canAccessSimulatorByRole;
      const canAccessConfigPage = canAccessSimulatorConfig() && canAccessSimulatorByRole;
      
      if (canAccessSimulatorPage) {
        navigate('/simulador');
      } else if (canAccessConfigPage) {
        navigate('/simulador/configuracoes');
      }
    } else if (module === 'settings') {
      navigate(computeSettingsPath());
    } else if (module === 'gestao') {
      navigate('/gestao');
    } else if (module === 'prospeccao') {
      navigate('/prospeccao');
    }
  };

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
    
    // Ordem de prioridade
    // 1. Gestão (unifica Meu Perfil, Empresa e Usuários)
    if (allowed('settings_profile') || allowed('settings_profile_info') || allowed('settings_profile_security') ||
        allowed('settings_company') || allowed('settings_company_data') || allowed('settings_company_branding') ||
        allowed('settings_users') || allowed('settings_users_list')) {
      return '/configuracoes/gestao';
    }
    
    // 2. Master Config (apenas para master)
    if (userRole === 'master') {
      return '/configuracoes/master';
    }
    
    // 3. Simulador (configurações do simulador)
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

  const modules = useMemo(() => {
    const isCollaborator = userRole === 'user';
    const allowedSettings = isCollaborator
      ? true // Colaborador vê Configurações (conteúdo restrito pelas rotas)
      : (canAccessSimulatorConfig() || userRole === 'admin' || userRole === 'master');

    const list: { key: 'simulator'|'settings'|'gestao'|'prospeccao'; label: string; path: string; allowed: boolean }[] = [
      { 
        key: 'simulator', 
        label: 'Simulador', 
        path: '/simulador', 
        allowed: !isCollaborator && (canAccessSimulator() || canAccessSimulatorConfig()) && canAccessSimulatorByRole 
      },
      { key: 'settings', label: 'Configurações', path: computeSettingsPath(), allowed: allowedSettings },
      { key: 'gestao', label: 'Gestão', path: '/gestao', allowed: true },
      { key: 'prospeccao', label: 'Prospecção', path: '/prospeccao', allowed: !isCollaborator },
    ];

    return list.filter(m => m.allowed);
  }, [perms, userRole, settingsPageKeys, canAccessSimulator, canAccessSimulatorConfig, canAccessSimulatorByRole]);

  const currentLabel = modules.find(m => m.key === current)?.label || (current === 'settings' ? 'Configurações' : 'Simulador');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center space-x-2 text-sm text-foreground px-3 py-1.5 brand-radius module-switcher-button"
          style={{ 
            backgroundColor: 'rgba(var(--brand-secondary-rgb), 0.10)',
            '--brand-secondary': secondaryColor,
            '--brand-primary': primaryColor
          } as React.CSSProperties}
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