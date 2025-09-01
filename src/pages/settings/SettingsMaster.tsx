
// import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Archive, Search, Building, Users, Shield, Trash2, Power, PowerOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/ui/multiselect';
import { useCrmUsersByCompany } from '@/hooks/useCrmUsers';
import { UserModal } from '@/components/CRM/Configuration/UserModal';


interface Company {
  id: string;
  name: string;
  status: 'active' | 'archived';
  created_at: string;
}

export default function SettingsMaster() {
  const { userRole, companyId, session, user } = useCrmAuth();
  
  // Debug logs para autenticação removidos
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  // Estados para modais
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  
  // Estados para itens selecionados
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [showEditCreateUserModal, setShowEditCreateUserModal] = useState(false);
  
  // Estados para busca
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  


  // Estados para edição de descrições removidos

  // Estados para criação de empresa
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [newCep, setNewCep] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStateUF, setNewStateUF] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newTimezone, setNewTimezone] = useState('America/Sao_Paulo');
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para modal de criar usuário
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Buscar cores da empresa
  const { data: branding } = useQuery({
    queryKey: ['company_branding', selectedCompanyId || companyId],
    enabled: !!(selectedCompanyId || companyId),
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', selectedCompanyId || companyId)
        .maybeSingle();
      return data;
    }
  });

  const primaryColor = branding?.primary_color || '#A86F57';
  const secondaryColor = branding?.secondary_color || '#6B7280';

    // Buscar usuários da empresa para o campo proprietário
  // Quando editando uma empresa, usar o ID da empresa sendo editada
  // Quando criando uma empresa, usar a empresa selecionada no contexto
  const effectiveCompanyId = selectedCompany?.id || selectedCompanyId || companyId;
  const { data: companyUsers = [], isLoading: usersLoading } = useCrmUsersByCompany(effectiveCompanyId);

  // Função para resetar formulário de criação de empresa
  const resetCompanyForm = () => {
    setNewCompanyName('');
    setNewCnpj('');
    setNewNiche('');
    setNewCep('');
    setNewStreet('');
    setNewNumber('');
    setNewNeighborhood('');
    setNewCity('');
    setNewStateUF('');
    setNewCountry('');
    setNewTimezone('America/Sao_Paulo');
    setNewOwnerId('');
  };

 

  // Dados
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies', 'master'],
    enabled: userRole === 'master',
    staleTime: 0, // Forçar sempre buscar dados frescos
    cacheTime: 0, // Não usar cache
    refetchOnMount: true, // Refazer query quando componente montar
    refetchOnWindowFocus: false, // Não refazer quando janela ganhar foco
    queryFn: async () => {
      // Logs de debug removidos
      
      try {
        // Primeiro buscar as empresas básicas
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, status, created_at, updated_at')
          .order('name');
        
        if (companiesError) {
          throw companiesError;
        }

        // Depois buscar os perfis das empresas para obter os dados completos
        const { data: profilesData, error: profilesError } = await supabase
          .from('company_profiles')
          .select('*');
        
        if (profilesError) {
          throw profilesError;
        }

        // Combinar os dados
        const companiesWithProfiles = companiesData?.map(company => {
          const profile = profilesData?.find(p => p.company_id === company.id);
          const combined = {
            ...company,
            cnpj: profile?.cnpj || '',
            niche: profile?.niche || '',
            cep: profile?.cep || '',
            street: profile?.address || '', // Campo correto é 'address'
            number: profile?.number || '',
            neighborhood: profile?.neighborhood || '',
            city: profile?.city || '',
            state_uf: profile?.state || '', // Campo correto é 'state'
            country: profile?.country || 'Brasil',
            timezone: profile?.timezone || 'America/Sao_Paulo'
          };
          return combined;
        }) || [];
        
        return companiesWithProfiles;
      } catch (error) {
        throw error;
      }
    }
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['role_page_permissions_all'],
    queryFn: async () => {
      // Buscar todas as permissões
      const { data, error } = await supabase
        .from('role_page_permissions')
        .select('*')
        .order('page, role');
      
      if (error) {
        throw error;
      }
      
      // Agrupar permissões por aba única (não por página)
      const groupedPermissions = data?.reduce((acc: any, permission: any) => {
        const pageInfo = getPageInfo(permission.page);
        
        // Pular páginas que não devem aparecer na tabela
        if (!pageInfo) {
          return acc;
        }
        
        // Usar uma chave única baseada no módulo + aba
        const uniqueKey = `${pageInfo.module}_${pageInfo.tab}`;
        
        if (!acc[uniqueKey]) {
          acc[uniqueKey] = {
            id: uniqueKey,
            page: permission.page, // Manter a página original para referência
            pageName: pageInfo.pageName,
            module: pageInfo.module,
            tab: pageInfo.tab,
            description: pageInfo.description,
            admin_allowed: false,
            leader_allowed: false,
            user_allowed: false
          };
        }
        
        // Definir permissão baseada no role
        if (permission.role === 'admin') {
          acc[uniqueKey].admin_allowed = permission.allowed;
        } else if (permission.role === 'leader') {
          acc[uniqueKey].leader_allowed = permission.allowed;
        } else if (permission.role === 'user') {
          acc[uniqueKey].user_allowed = permission.allowed;
        }
        
        return acc;
      }, {}) || {};
      
      // Converter para array
      const permissionsArray = Object.values(groupedPermissions);
      
      return permissionsArray;
    }
  });

  // useEffect removido - não mais necessário

  // Função isPageActive removida

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: any) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', 'master'] });
      toast.success('Empresa criada com sucesso!');
      setShowCompanyModal(false);
      resetCompanyForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar empresa: ' + error.message);
    }
  });

  const toggleCompanyStatusMutation = useMutation({
    mutationFn: async ({ companyId, newStatus }: { companyId: string; newStatus: 'active' | 'archived' }) => {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['companies', 'master'] });
      const statusText = newStatus === 'active' ? 'ativada' : 'desativada';
      toast.success(`Empresa ${statusText} com sucesso!`);
    },
    onError: (error: any) => {
      toast.error('Erro ao alterar status da empresa: ' + error.message);
    }
  });

  const togglePermissionMutation = useMutation({
    mutationFn: async ({ page, role, allowed }: { page: string; role: string; allowed: boolean }) => {
      console.log('togglePermissionMutation iniciada:', { page, role, allowed, companyId });
      
      // Buscar a permissão existente para esta página e role
      const { data: existingPermission, error: fetchError } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('page', page)
        .eq('role', role)
        .maybeSingle();

      console.log('Busca de permissão existente:', { existingPermission, fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError;
      }

      if (existingPermission) {
        // Atualizar permissão existente
        console.log('Atualizando permissão existente:', existingPermission.id);
        const { error } = await supabase
          .from('role_page_permissions')
          .update({ allowed })
          .eq('id', existingPermission.id);
        if (error) {
          console.error('Erro ao atualizar permissão:', error);
          throw error;
        }
        console.log('Permissão atualizada com sucesso');
      } else {
        // Criar nova permissão
        console.log('Criando nova permissão');
        const { error } = await supabase
          .from('role_page_permissions')
          .insert([{
            page,
            role,
            allowed,
            company_id: companyId // Assuming companyId is available in context
          }]);
        if (error) {
          console.error('Erro ao criar permissão:', error);
          throw error;
        }
        console.log('Nova permissão criada com sucesso');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_page_permissions_all'] });
      toast.success('Permissão atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na mutation togglePermission:', error);
      toast.error('Erro ao atualizar permissão: ' + error.message);
    }
  });

  const togglePageStatusMutation = useMutation({
    mutationFn: async ({ page, status }: { page: string; status: 'active' | 'inactive' }) => {
      // Atualizar todas as permissões da página para o status desejado
      const { error } = await supabase
        .from('role_page_permissions')
        .update({ allowed: status === 'active' })
        .eq('page', page);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_page_permissions_all'] });
      toast.success('Status da página atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status da página: ' + error.message);
    }
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: async ({ page, description }: { page: string; description: string }) => {
      // Por enquanto, vamos apenas simular a atualização
      // Em uma implementação futura, isso seria salvo no banco de dados
      console.log('Atualizando descrição:', { page, description });
      
      // Simular delay para mostrar que está funcionando
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_page_permissions_all'] });
      toast.success('Descrição atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar descrição: ' + error.message);
    }
  });

  // Funções auxiliares

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompanyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    setIsCreating(true);
    try {
      const companyData = {
        name: newCompanyName.trim(),
        owner_id: newOwnerId || null,
        status: 'active'
      };

      // Criar empresa primeiro
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (companyError) throw companyError;

      // Criar perfil da empresa
      const profileData = {
        company_id: newCompany.id,
        name: newCompanyName.trim(),
        cnpj: newCnpj.trim() || null,
        niche: newNiche.trim() || null,
        cep: newCep.trim() || null,
        address: newStreet.trim() || null,
        number: newNumber.trim() || null,
        neighborhood: newNeighborhood.trim() || null,
        city: newCity.trim() || null,
        state: newStateUF.trim() || null,
        country: newCountry.trim() || 'Brasil',
        timezone: newTimezone
      };

      const { error: profileError } = await supabase
        .from('company_profiles')
        .insert([profileData]);

      if (profileError) throw profileError;

      queryClient.invalidateQueries({ queryKey: ['companies', 'master'] });
      toast.success('Empresa criada com sucesso!');
      setShowCompanyModal(false);
      resetCompanyForm();
    } catch (error: any) {
      toast.error('Erro ao criar empresa: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCompany = async (company: any) => {
    try {
      // Buscar dados completos da empresa diretamente do backend
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .single();
      
      if (companyError) throw companyError;
      
      const { data: profileData, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('company_id', company.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw profileError;
      }
      
      // Combinar dados
      const companyCopy = {
        id: companyData.id,
        name: companyData.name || '',
        owner_id: companyData.owner_id || '',
        cnpj: profileData?.cnpj || '',
        niche: profileData?.niche || '',
        cep: profileData?.cep || '',
        street: profileData?.address || '',
        number: profileData?.number || '',
        neighborhood: profileData?.neighborhood || '',
        city: profileData?.city || '',
        state_uf: profileData?.state || '',
        country: profileData?.country || 'Brasil',
        timezone: profileData?.timezone || 'America/Sao_Paulo',
        status: companyData.status || 'active'
      };
      
      setSelectedOwnerId(companyData.owner_id || '');
      
      setSelectedCompany(companyCopy);
      setShowEditCompanyModal(true);
    } catch (error: any) {
      console.error('Erro ao buscar dados da empresa:', error);
      toast.error('Erro ao carregar dados da empresa: ' + error.message);
    }
  };

  const handleToggleCompanyStatus = async (company: any) => {
    // Proteger a Best Piece
    if (company.name.toLowerCase().includes('best piece')) {
      toast.error('A Best Piece não pode ser desativada!');
      return;
    }

    const newStatus = company.status === 'active' ? 'archived' : 'active';
    const actionText = newStatus === 'active' ? 'ativar' : 'desativar';
    
    if (confirm(`Tem certeza que deseja ${actionText} esta empresa?`)) {
      await toggleCompanyStatusMutation.mutateAsync({ companyId: company.id, newStatus });
    }
  };

  // Função handleTogglePermission removida

  // Função para mapear páginas para módulos e abas
  const getPageInfo = (page: string) => {
    const pageMappings: { [key: string]: { module: string; tab: string; pageName: string; description: string } } = {
      // Módulo de Configurações - Gestão
      'settings_profile_info': { 
        module: 'Configurações', 
        tab: 'Meu Perfil', 
        pageName: 'Gestão',
        description: 'Pode ver e editar as informações do próprio perfil'
      },
      'settings_profile_integrations': { 
        module: 'Configurações', 
        tab: 'Meu Perfil', 
        pageName: 'Gestão',
        description: 'Pode ver e editar as informações do próprio perfil'
      },
      'settings_profile_security': { 
        module: 'Configurações', 
        tab: 'Meu Perfil', 
        pageName: 'Gestão',
        description: 'Pode ver e editar as informações do próprio perfil'
      },
      'settings_company_data': { 
        module: 'Configurações', 
        tab: 'Empresa', 
        pageName: 'Gestão',
        description: 'Pode ver e editar informações da própria empresa'
      },
      'settings_company_branding': { 
        module: 'Configurações', 
        tab: 'Empresa', 
        pageName: 'Gestão',
        description: 'Pode ver e editar informações da própria empresa'
      },
      'settings_users_list': { 
        module: 'Configurações', 
        tab: 'Usuários', 
        pageName: 'Gestão',
        description: 'Pode ver todos usuários, criar usuários, editá-los e desativar usuários. Usuário NÃO pode se desativar'
      },
      
      // Configurações CRM
      'crm_config_funnels': { 
        module: 'Configurações', 
        tab: 'Funis', 
        pageName: 'Configurações CRM',
        description: 'Pode criar, editar e arquivar Funis'
      },
      'crm_config_sources': { 
        module: 'Configurações', 
        tab: 'Origens', 
        pageName: 'Configurações CRM',
        description: 'Pode criar, editar e arquivar origens'
      },
      'crm_config_teams': { 
        module: 'Configurações', 
        tab: 'Times', 
        pageName: 'Configurações CRM',
        description: 'Pode criar, editar e arquivar Times'
      },
      'crm_config_users': { 
        module: 'Configurações', 
        tab: 'Usuários', 
        pageName: 'Configurações CRM',
        description: 'Gerenciar usuários do CRM'
      },
      
      // Configurações de Agendamento
      'settings_agendamento_availability': { 
        module: 'Configurações', 
        tab: 'Disponibilidade', 
        pageName: 'Configurações',
        description: 'Gerenciar disponibilidade para agendamentos'
      },
      'settings_agendamento_event_types': { 
        module: 'Configurações', 
        tab: 'Tipos de Evento', 
        pageName: 'Configurações',
        description: 'Gerenciar tipos de eventos'
      },
      'settings_agendamento_forms': { 
        module: 'Configurações', 
        tab: 'Formulários', 
        pageName: 'Configurações',
        description: 'Gerenciar formulários de agendamento'
      },
      'settings_agendamento_calendar': { 
        module: 'Configurações', 
        tab: 'Calendário', 
        pageName: 'Configurações',
        description: 'Configurar calendário de agendamentos'
      },

      // Módulo do Simulador
      'simulator': { 
        module: 'Simulador', 
        tab: 'Simulador', 
        pageName: 'Simulador',
        description: 'Pode usar o simulador'
      },
      
      // Configurações do Simulador
      'simulator_config_administrators': { 
        module: 'Simulador', 
        tab: 'Administradoras', 
        pageName: 'Configurações do Simulador',
        description: 'Pode criar, editar e arquivar administradoras'
      },
      'simulator_config_reductions': { 
        module: 'Simulador', 
        tab: 'Redução de Parcela', 
        pageName: 'Configurações do Simulador',
        description: 'Pode criar, editar e arquivar Redução de Parcela'
      },
      'simulator_config_installments': { 
        module: 'Simulador', 
        tab: 'Parcelas', 
        pageName: 'Configurações do Simulador',
        description: 'Pode criar, editar e arquivar Parcelas'
      },
      'simulator_config_products': { 
        module: 'Simulador', 
        tab: 'Produtos', 
        pageName: 'Configurações do Simulador',
        description: 'Pode criar, editar e arquivar Produtos'
      },
      'simulator_config_leverages': { 
        module: 'Simulador', 
        tab: 'Alavancas', 
        pageName: 'Configurações do Simulador',
        description: 'Pode criar, editar e arquivar Alavancas'
      },

      // Módulo CRM
      'indicadores': { 
        module: 'CRM', 
        tab: 'Performance', 
        pageName: 'Indicadores',
        description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
      },
      'indicadores_performance': { 
        module: 'CRM', 
        tab: 'Performance', 
        pageName: 'Indicadores',
        description: 'Pode ver todos os indicadores, de todos os funis, de todas as equipes e de todos os usuários'
      },
      'indicadores_registro': { 
        module: 'CRM', 
        tab: 'Registro de Indicadores', 
        pageName: 'Indicadores',
        description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
      },
      'reports': { 
        module: 'CRM', 
        tab: 'Registro de Indicadores', 
        pageName: 'Indicadores',
        description: 'Pode registrar indicadores somente para si, editar somente os próprios indicadores e pode ver os indicadores de todos os funis, de todos os times e de todos os usuários'
      },
      
      // Comercial
      'comercial': { 
        module: 'CRM', 
        tab: 'Leads', 
        pageName: 'Comercial',
        description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
      },
      'comercial_leads': { 
        module: 'CRM', 
        tab: 'Leads', 
        pageName: 'Comercial',
        description: 'Pode ver todos os leads, criar leads para qualquer usuário, editar os leads de qualquer usuário e excluir leads de qualquer usuário'
      },
      'comercial_sales': { 
        module: 'CRM', 
        tab: 'Vendas', 
        pageName: 'Comercial',
        description: 'Pode ver ver todos as vendas, registrar vendas para qualquer usuário, editar as vendas de qualquer usuário e excluir vendas de qualquer usuário'
      },
      
      // Outras páginas CRM
      'dashboard': { 
        module: 'CRM', 
        tab: 'Dashboard', 
        pageName: 'Dashboard',
        description: 'Acesso ao dashboard do CRM'
      },
      'agenda': { 
        module: 'CRM', 
        tab: 'Agenda', 
        pageName: 'Agenda',
        description: 'Gerenciar agenda'
      },
      'agenda_temp': { 
        module: 'CRM', 
        tab: 'Agenda', 
        pageName: 'Agenda',
        description: 'Gerenciar agenda'
      },

      // CRM Master (removido - não deve aparecer nas permissões)
      'crm_master_accesses': { module: 'CRM Master', tab: 'Acessos', pageName: 'CRM Master', description: '' },
      'crm_master_archived': { module: 'CRM Master', tab: 'Arquivados', pageName: 'CRM Master', description: '' },
      'crm_master_companies': { module: 'CRM Master', tab: 'Empresas', pageName: 'CRM Master', description: '' }
    };

    return pageMappings[page] || null; // Retorna null para páginas que não devem aparecer na tabela
  };

  // Funções de filtros removidas

  // Filtros
  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.cnpj?.includes(companySearchTerm) ||
    company.niche?.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  // Debug logs removidos

  // filteredPermissions removido - não mais necessário

  // Verificar permissões
  const canManageCompanies = userRole === 'master';
  const canManagePermissions = userRole === 'master';

  const allowedOrder: { key: string; allowed: boolean }[] = [
    { key: 'companies', allowed: canManageCompanies },
  ];
  const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
  const [tabValue, setTabValue] = useState<string>(firstAllowed || 'companies');
  
  useEffect(() => {
    const next = allowedOrder.find(i => i.allowed)?.key || 'companies';
    if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
      setTabValue(next);
    }
  }, [canManageCompanies, canManagePermissions, tabValue]);

  // Verificar acesso
  if (userRole !== 'master') {
    return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Apenas usuários Master podem acessar esta página.</p>
        </div>
      </div>
    );
  }



  // Função clearAllFilters removida

  // Funções antigas removidas

  // Funções de descrição removidas

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Master Config</h1>
        <p className="text-muted-foreground">Gerencie todas as empresas do sistema</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              {canManageCompanies && (
                <>
                  <TabsTrigger 
                    value="companies" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                    style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                  >
                    Empresas
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

            </TabsList>

            {canManageCompanies && (
              <TabsContent value="companies" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Empresas</h2>
                      <p className="text-muted-foreground mt-1">Gerencie todas as empresas do sistema</p>
                    </div>
                    <Button onClick={() => setShowCompanyModal(true)} variant="brandPrimaryToSecondary" className="brand-radius">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Empresa
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por nome, CNPJ ou nicho..."
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left py-2">Nome</TableHead>
                        <TableHead className="text-left py-2">CNPJ</TableHead>
                        <TableHead className="text-left py-2">Nicho</TableHead>
                        <TableHead className="text-left py-2">Status</TableHead>
                        <TableHead className="text-left py-2">Cidade/UF</TableHead>
                        <TableHead className="text-right py-2">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companiesLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-2">
                            Carregando empresas...
                          </TableCell>
                        </TableRow>
                      ) : filteredCompanies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            {companySearchTerm ? 'Nenhuma empresa encontrada com este termo.' : 'Nenhuma empresa encontrada. Crie a primeira empresa para começar.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium py-2">{company.name}</TableCell>
                            <TableCell className="py-2">{company.cnpj || '-'}</TableCell>
                            <TableCell className="py-2">{company.niche || '-'}</TableCell>
                            <TableCell className="py-2">
                              {company.status === 'active' ? (
                                <Badge
                                  className="text-white"
                                  style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                                >
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="destructive" style={{ borderRadius: 'var(--brand-radius, 8px)' }}>
                                  Arquivada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              {company.city && company.state_uf ? `${company.city}/${company.state_uf}` : '-'}
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCompany(company)}
                                  className="text-white hover:bg-[var(--brand-secondary)] brand-radius"
                                  style={{ '--brand-secondary': secondaryColor } as React.CSSProperties}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!company.name.toLowerCase().includes('best piece') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleCompanyStatus(company)}
                                    title={company.status === 'active' ? 'Desativar empresa' : 'Ativar empresa'}
                                    className="text-white hover:bg-[var(--brand-secondary)] brand-radius"
                                    style={{ '--brand-secondary': secondaryColor } as React.CSSProperties}
                                  >
                                    {company.status === 'active' ? (
                                      <PowerOff className="w-4 h-4" />
                                    ) : (
                                      <Power className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}


          </Tabs>
        </CardContent>
      </Card>

            {/* Modal de Edição de Empresa */}
      {showEditCompanyModal && selectedCompany && (
        <FullScreenModal
          isOpen={showEditCompanyModal}
          onClose={() => {
            setShowEditCompanyModal(false);
            setSelectedCompany(null);
          }}
          title="Editar Empresa"
          actions={
            <Button
              type="submit"
              form="edit-company-form"
              variant="brandPrimaryToSecondary"
              className="brand-radius"
            >
              Salvar Alterações
            </Button>
          }
        >
          <form id="edit-company-form" onSubmit={async (e) => {
            e.preventDefault();
            try {
              // Separar dados da empresa e do perfil
              const { id, name, status, created_at, updated_at, street, state_uf, ...profileData } = selectedCompany;
              
              // Atualizar dados básicos da empresa
              const { error: companyError } = await supabase
                .from('companies')
                .update({ 
                  name,
                  owner_id: selectedOwnerId || null
                })
                .eq('id', id);
              
              if (companyError) throw companyError;
              
              // Mapear campos para os nomes corretos da tabela company_profiles
              const profileUpdateData = {
                company_id: id,
                name: name,
                cnpj: profileData.cnpj || null,
                niche: profileData.niche || null,
                cep: profileData.cep || null,
                address: street || null, // Mapear street para address
                number: profileData.number || null,
                neighborhood: profileData.neighborhood || null,
                city: profileData.city || null,
                state: state_uf || null, // Mapear state_uf para state
                country: profileData.country || 'Brasil',
                timezone: profileData.timezone || 'America/Sao_Paulo'
              };
              
              // Atualizar ou criar perfil da empresa
              const { error: profileError } = await supabase
                .from('company_profiles')
                .upsert(profileUpdateData);
              
              if (profileError) throw profileError;
              
              queryClient.invalidateQueries({ queryKey: ['companies'] });
              toast.success('Empresa atualizada com sucesso!');
              setShowEditCompanyModal(false);
              setSelectedCompany(null);
            } catch (error: any) {
              toast.error('Erro ao atualizar empresa: ' + error.message);
            }
          }} className="space-y-4 bg-[#1F1F1F] p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCompanyName">Nome da Empresa *</Label>
                  <Input
                    id="editCompanyName"
                    value={selectedCompany.name}
                    onChange={(e) => setSelectedCompany({...selectedCompany, name: e.target.value})}
                    placeholder="Digite o nome da empresa"
                    className="campo-brand brand-radius"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editOwner">Proprietário</Label>
                  <Select
                    value={selectedOwnerId}
                    onValueChange={(value) => {
                      if (value === 'create') {
                        setShowEditCreateUserModal(true);
                      } else {
                        setSelectedOwnerId(value);
                      }
                    }}
                    disabled={usersLoading}
                  >
                                    <SelectTrigger className="select-trigger-brand brand-radius text-left">
                  <SelectValue placeholder="Selecione o proprietário da empresa" />
                </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create" className="dropdown-item-brand">
                        + Criar usuário
                      </SelectItem>
                      {companyUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="dropdown-item-brand">
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                O proprietário terá acesso total a todos os recursos da empresa
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCnpj">CNPJ</Label>
                  <Input
                    id="editCnpj"
                    value={selectedCompany.cnpj || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    className="campo-brand brand-radius"
                  />
                </div>
                <div>
                  <Label htmlFor="editNiche">Nicho</Label>
                  <Input
                    id="editNiche"
                    value={selectedCompany.niche || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, niche: e.target.value})}
                    placeholder="Ex: Imobiliário, Financeiro"
                    className="campo-brand brand-radius"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCep">CEP</Label>
                  <Input
                    id="editCep"
                    value={selectedCompany.cep || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, cep: e.target.value})}
                    placeholder="00000-000"
                    className="campo-brand brand-radius"
                  />
                </div>
                <div>
                  <Label htmlFor="editStreet">Endereço</Label>
                  <Input
                    id="editStreet"
                    value={selectedCompany.street || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, street: e.target.value})}
                    placeholder="Rua, Avenida, etc."
                    className="campo-brand brand-radius"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editNumber">Número</Label>
                  <Input
                    id="editNumber"
                    value={selectedCompany.number || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, number: e.target.value})}
                    placeholder="123"
                    className="campo-brand brand-radius"
                  />
                </div>
                <div>
                  <Label htmlFor="editNeighborhood">Bairro</Label>
                  <Input
                    id="editNeighborhood"
                    value={selectedCompany.neighborhood || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, neighborhood: e.target.value})}
                    placeholder="Centro"
                    className="campo-brand brand-radius"
                  />
                </div>
                <div>
                  <Label htmlFor="editCity">Cidade</Label>
                  <Input
                    id="editCity"
                    value={selectedCompany.city || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, city: e.target.value})}
                    placeholder="São Paulo"
                    className="campo-brand brand-radius"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editState">Estado</Label>
                  <Input
                    id="editState"
                    value={selectedCompany.state_uf || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, state_uf: e.target.value})}
                    placeholder="SP"
                    className="campo-brand brand-radius"
                  />
                </div>
                <div>
                  <Label htmlFor="editCountry">País</Label>
                  <Input
                    id="editCountry"
                    value={selectedCompany.country || ''}
                    onChange={(e) => setSelectedCompany({...selectedCompany, country: e.target.value})}
                    placeholder="Brasil"
                    className="campo-brand brand-radius"
                  />
                </div>
                <div>
                  <Label htmlFor="editTimezone">Fuso Horário</Label>
                  <Select value={selectedCompany.timezone || 'America/Sao_Paulo'} onValueChange={(value) => setSelectedCompany({...selectedCompany, timezone: value})}>
                    <SelectTrigger className="select-trigger-brand brand-radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo" className="dropdown-item-brand">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus" className="dropdown-item-brand">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Belem" className="dropdown-item-brand">Belém (GMT-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
        </FullScreenModal>
      )}

      {/* Modal de Criação de Empresa */}
      {showCompanyModal && (
        <FullScreenModal
          isOpen={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            resetCompanyForm();
          }}
          title="Nova Empresa"
          actions={
            <Button
              type="submit"
              form="create-company-form"
              variant="brandPrimaryToSecondary"
              className="brand-radius"
              disabled={isCreating || !newCompanyName.trim()}
            >
              {isCreating ? 'Criando...' : 'Criar Empresa'}
            </Button>
          }
        >
          <form id="create-company-form" onSubmit={handleCreateCompany} className="space-y-4 bg-[#1F1F1F] p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Digite o nome da empresa"
                  className="campo-brand brand-radius"
                  required
                />
              </div>

              <div>
                <Label htmlFor="owner">Proprietário</Label>
                <Select
                  value={newOwnerId}
                  onValueChange={(value) => {
                    if (value === 'create') {
                      setShowCreateUserModal(true);
                    } else {
                      setNewOwnerId(value);
                    }
                  }}
                  disabled={usersLoading}
                >
                  <SelectTrigger className="select-trigger-brand brand-radius text-left">
                    <SelectValue placeholder="Selecione o proprietário da empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create" className="dropdown-item-brand">
                      + Criar usuário
                    </SelectItem>
                    {companyUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="dropdown-item-brand">
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              O proprietário terá acesso total a todos os recursos da empresa
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={newCnpj}
                  onChange={(e) => setNewCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="niche">Nicho</Label>
                <Input
                  id="niche"
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                  placeholder="Ex: Imobiliário, Financeiro"
                  className="campo-brand brand-radius"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={newCep}
                  onChange={(e) => setNewCep(e.target.value)}
                  placeholder="00000-000"
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="street">Endereço</Label>
                <Input
                  id="street"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  className="campo-brand brand-radius"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="123"
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={newNeighborhood}
                  onChange={(e) => setNewNeighborhood(e.target.value)}
                  placeholder="Centro"
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="São Paulo"
                  className="campo-brand brand-radius"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={newStateUF}
                  onChange={(e) => setNewStateUF(e.target.value)}
                  placeholder="SP"
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="Brasil"
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select value={newTimezone} onValueChange={setNewTimezone}>
                  <SelectTrigger className="select-trigger-brand brand-radius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo" className="dropdown-item-brand">São Paulo (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus" className="dropdown-item-brand">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Belem" className="dropdown-item-brand">Belém (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </FullScreenModal>
      )}

      {/* Modal de Criar Usuário */}
      {showCreateUserModal && (
        <UserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={(newUser) => {
            setNewOwnerId(newUser.id);
            setShowCreateUserModal(false);
            toast.success('Usuário criado com sucesso!');
          }}
        />
      )}

      {/* Modal de Criar Usuário para Edição */}
      {showEditCreateUserModal && (
        <UserModal
          isOpen={showEditCreateUserModal}
          onClose={() => setShowEditCreateUserModal(false)}
          onSuccess={(newUser) => {
            setSelectedOwnerId(newUser.id);
            setShowEditCreateUserModal(false);
            toast.success('Usuário criado com sucesso!');
          }}
        />
      )}


    </>
  );
} 