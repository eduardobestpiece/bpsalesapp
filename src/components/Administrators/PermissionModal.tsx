import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCrmUsersByCompany } from '@/hooks/useCrmUsers';
import { useTeams } from '@/hooks/useTeams';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { TeamModal } from '../CRM/Configuration/TeamModal';
import { UserModal } from '../CRM/Configuration/UserModal';
import { Input } from '@/components/ui/input';

// Interfaces
interface PermissionRow {
  id: string;
  permission: string;
  view: number;
  edit: number;
  create: number;
  archive: number;
  deactivate: number;
}

interface FormData {
  name: string;
  level: 'Função' | 'Time' | 'Usuário';
  detail: string;
}

// Schema de validação
const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  level: z.enum(['Função', 'Time', 'Usuário']),
  detail: z.string().optional(),
});

// Função para gerar as permissões padrão
const generatePermissionRows = (): PermissionRow[] => {
  return [
    {
      id: 'simulator',
      permission: 'Simulador',
      view: 0,
      edit: 0,
      create: 0,
      archive: 0,
      deactivate: 0
    },
    {
      id: 'simulator-config',
      permission: 'Configurações do Simulador',
      view: 0,
      edit: 0,
      create: 0,
      archive: 0,
      deactivate: 0
    },
    {
      id: 'management',
      permission: 'Gestão',
      view: 0,
      edit: 0,
      create: 0,
      archive: 0,
      deactivate: 0
    },
    {
      id: 'crm-config',
      permission: 'Configurações do CRM',
      view: 0,
      edit: 0,
      create: 0,
      archive: 0,
      deactivate: 0
    },
    {
      id: 'indicators',
      permission: 'Indicadores',
      view: 0,
      edit: 0,
      create: 0,
      archive: 0,
      deactivate: 0
    },
    {
      id: 'leads',
      permission: 'Leads',
      view: 0,
      edit: 0,
      create: 0,
      archive: 0,
      deactivate: 0
    }
  ];
};

// Funções compartilhadas para operações de banco de dados
const savePermissionToDatabase = async (formData: FormData, permissionRows: PermissionRow[], effectiveCompanyId: string) => {
  if (!effectiveCompanyId) {
    throw new Error('Company ID não encontrado');
  }

  try {
    console.log('Tentando salvar permissão:', { formData, permissionRows, companyId: effectiveCompanyId });

    // 1. Salvar a permissão principal
    const permissionData = {
      name: formData.name,
      level: formData.level,
      detail_value: formData.detail,
      team_id: formData.level === 'Time' && formData.detail !== 'add_team' ? formData.detail : null,
      user_id: formData.level === 'Usuário' && formData.detail !== 'add_user' ? formData.detail : null,
      company_id: effectiveCompanyId,
      status: 'active'
    };

    console.log('Dados da permissão:', permissionData);

    // Usar uma abordagem mais direta sem depender de autenticação
    const { data: permission, error: permissionError } = await supabase
      .from('custom_permissions')
      .insert(permissionData)
      .select()
      .single();

    if (permissionError) {
      console.error('Erro ao salvar permissão principal:', permissionError);
      
      // Se o erro for de RLS, tentar uma abordagem alternativa
      if (permissionError.code === '42501') {
        console.log('Erro de RLS detectado, tentando abordagem alternativa...');

        // Tentar inserir sem select para ver se funciona
        const { error: insertError } = await supabase
          .from('custom_permissions')
          .insert(permissionData);
          
        if (insertError) {
          console.error('Erro na abordagem alternativa:', insertError);
          throw insertError;
        }
        
        // Se inseriu com sucesso, buscar o registro inserido
        const { data: insertedPermission, error: fetchError } = await supabase
          .from('custom_permissions')
          .select()
          .eq('name', formData.name)
          .eq('company_id', effectiveCompanyId)
          .eq('level', formData.level)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (fetchError) {
          console.error('Erro ao buscar permissão inserida:', fetchError);
          throw fetchError;
        }
        
        console.log('Permissão principal salva (abordagem alternativa):', insertedPermission);
        
        // Continuar com os detalhes usando o ID da permissão inserida
        const permissionId = insertedPermission.id;
        
        // 2. Salvar os detalhes das permissões para cada módulo
        const permissionDetails = [];
        
        for (const row of permissionRows) {
          // Converter valores dos sliders para o formato do banco
          const convertValue = (moduleId: string, sliderValue: number): string => {
            if (['crm-config', 'indicators', 'leads'].includes(moduleId)) {
              // 4 níveis
              switch (sliderValue) {
                case 0: return 'none';
                case 1: return 'personal';
                case 2: return 'team';
                case 3: return 'company';
                default: return 'none';
              }
            } else {
              // 2 níveis
              switch (sliderValue) {
                case 0: return 'none';
                case 1: return 'allowed';
                default: return 'none';
              }
            }
          };

          permissionDetails.push({
            permission_id: permissionId,
            module_name: row.id,
            can_view: convertValue(row.id, row.view),
            can_edit: convertValue(row.id, row.edit),
            can_create: convertValue(row.id, row.create),
            can_archive: convertValue(row.id, row.archive),
            can_deactivate: convertValue(row.id, row.deactivate)
          });
        }

        console.log('Detalhes das permissões:', permissionDetails);

        const { error: detailsError } = await supabase
          .from('permission_details')
          .insert(permissionDetails);

        if (detailsError) {
          console.error('Erro ao salvar detalhes:', detailsError);
          throw detailsError;
        }

        console.log('Permissão salva com sucesso!');
        return insertedPermission;
      } else {
        throw permissionError;
      }
    }

    console.log('Permissão principal salva:', permission);

    // 2. Salvar os detalhes das permissões para cada módulo
    const permissionDetails = [];
    
    for (const row of permissionRows) {
      // Converter valores dos sliders para o formato do banco
      const convertValue = (moduleId: string, sliderValue: number): string => {
        if (['crm-config', 'indicators', 'leads'].includes(moduleId)) {
          // 4 níveis
          switch (sliderValue) {
            case 0: return 'none';
            case 1: return 'personal';
            case 2: return 'team';
            case 3: return 'company';
            default: return 'none';
          }
        } else {
          // 2 níveis
          switch (sliderValue) {
            case 0: return 'none';
            case 1: return 'allowed';
            default: return 'none';
          }
        }
      };

      permissionDetails.push({
        permission_id: permission.id,
        module_name: row.id,
        can_view: convertValue(row.id, row.view),
        can_edit: convertValue(row.id, row.edit),
        can_create: convertValue(row.id, row.create),
        can_archive: convertValue(row.id, row.archive),
        can_deactivate: convertValue(row.id, row.deactivate)
      });
    }

    console.log('Detalhes das permissões:', permissionDetails);

    const { error: detailsError } = await supabase
      .from('permission_details')
      .insert(permissionDetails);

    if (detailsError) {
      console.error('Erro ao salvar detalhes:', detailsError);
      throw detailsError;
    }

    console.log('Permissão salva com sucesso!');
    return permission;
  } catch (error) {
    console.error('Erro ao salvar permissão:', error);
    throw error;
  }
};

const loadPermissionForEdit = async (permissionId: string) => {
  try {
    const { data: permission, error } = await supabase
      .from('custom_permissions')
      .select(`
        *,
        permission_details (*)
      `)
      .eq('id', permissionId)
      .single();

    if (error) throw error;

    // Converter dados do banco para o formato do modal
    const convertFromDatabase = (moduleId: string, permissionValue: string): number => {
      if (['crm-config', 'indicators', 'leads'].includes(moduleId)) {
        switch (permissionValue) {
          case 'none': return 0;
          case 'personal': return 1;
          case 'team': return 2;
          case 'company': return 3;
          default: return 0;
        }
      } else {
        switch (permissionValue) {
          case 'none': return 0;
          case 'allowed': return 1;
          default: return 0;
        }
      }
    };



    const loadedPermissionRows = generatePermissionRows().map(row => {
      const detail = permission.permission_details?.find(d => d.module_name === row.id);
      if (detail) {
        return {
          ...row,
          view: convertFromDatabase(row.id, detail.can_view),
          edit: convertFromDatabase(row.id, detail.can_edit),
          create: convertFromDatabase(row.id, detail.can_create),
          archive: convertFromDatabase(row.id, detail.can_archive),
          deactivate: convertFromDatabase(row.id, detail.can_deactivate)
        };
      }
      return row;
    });

    return {
      formData: {
        name: permission.name,
        level: permission.level,
        detail: permission.detail_value || ''
      },
      permissionRows: loadedPermissionRows
    };
  } catch (error) {
    console.error('Erro ao carregar permissão para edição:', error);
    throw error;
  }
};

const updatePermissionInDatabase = async (permissionId: string, formData: FormData, permissionRows: PermissionRow[]) => {
  try {
    // 1. Atualizar a permissão principal
    const { error: updateError } = await supabase
      .from('custom_permissions')
      .update({
        name: formData.name,
        level: formData.level,
        detail_value: formData.detail,
        team_id: formData.level === 'Time' && formData.detail !== 'add_team' ? formData.detail : null,
        user_id: formData.level === 'Usuário' && formData.detail !== 'add_user' ? formData.detail : null,
      })
      .eq('id', permissionId);

    if (updateError) throw updateError;

    // 2. Deletar detalhes antigos
    const { error: deleteError } = await supabase
      .from('permission_details')
      .delete()
      .eq('permission_id', permissionId);

    if (deleteError) throw deleteError;

    // 3. Inserir novos detalhes
    const permissionDetails = [];
    
    for (const row of permissionRows) {
      const convertValue = (moduleId: string, sliderValue: number): string => {
        if (['crm-config', 'indicators', 'leads'].includes(moduleId)) {
          switch (sliderValue) {
            case 0: return 'none';
            case 1: return 'personal';
            case 2: return 'team';
            case 3: return 'company';
            default: return 'none';
          }
        } else {
          switch (sliderValue) {
            case 0: return 'none';
            case 1: return 'allowed';
            default: return 'none';
          }
        }
      };

      permissionDetails.push({
        permission_id: permissionId,
        module_name: row.id,
        can_view: convertValue(row.id, row.view),
        can_edit: convertValue(row.id, row.edit),
        can_create: convertValue(row.id, row.create),
        can_archive: convertValue(row.id, row.archive),
        can_deactivate: convertValue(row.id, row.deactivate)
      });
    }

    const { error: insertError } = await supabase
      .from('permission_details')
      .insert(permissionDetails);

    if (insertError) throw insertError;

    return true;
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    throw error;
  }
};

// Função para carregar permissões do Supabase
const loadPermissionsFromDatabase = async (effectiveCompanyId: string) => {
  if (!effectiveCompanyId) return [];

  try {
    const { data: permissions, error } = await supabase
      .from('custom_permissions')
      .select(`
        *,
        permission_details (*)
      `)
      .eq('company_id', effectiveCompanyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return permissions || [];
  } catch (error) {
    console.error('Erro ao carregar permissões:', error);
    return [];
  }
};

// Função para obter as opções do campo Detalhamento baseado no nível
const getDetailOptions = (teams: any[], users: any[], selectedLevel: 'Função' | 'Time' | 'Usuário', detailValue: string) => {
  switch (selectedLevel) {
    case 'Função':
      return [
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Líder', label: 'Líder' },
        { value: 'Usuário', label: 'Usuário' }
      ];
    
    case 'Time':
      const teamOptions = teams.map(team => ({
        value: team.id,
        label: team.name
      }));
      return [
        { value: 'add_team', label: '+ Adicionar Time' },
        ...teamOptions
      ];
    
    case 'Usuário':
      const userOptions = users.map(user => ({
        value: user.id,
        label: `${user.first_name} ${user.last_name} (${user.email})`
      }));
      return [
        { value: 'add_user', label: '+ Adicionar Usuário' },
        ...userOptions
      ];
    
    default:
      return [];
  }
};

// Função para lidar com a seleção do detalhamento
const handleDetailChange = (value: string, setShowTeamModal: (open: boolean) => void, setShowUserModal: (open: boolean) => void, form: any) => {
  if (value === 'add_team') {
    setShowTeamModal(true);
    return;
  }
  
  if (value === 'add_user') {
    setShowUserModal(true);
    return;
  }
  
  form.setValue('detail', value);
};

// Função para converter valor numérico em texto
const getAccessLevelText = (value: number, levels: number = 2): string => {
  if (levels === 4) {
    switch (value) {
      case 0: return 'Nenhum';
      case 1: return 'Pessoal';
      case 2: return 'Time';
      case 3: return 'Empresa';
      default: return 'Nenhum';
    }
  } else {
  return value === 1 ? 'Permitido' : 'Nenhum';
  }
};

// Componente de slider customizado
const CustomSlider: React.FC<{
  value: number;
  onValueChange: (value: number) => void;
  primaryColor: string;
  levels?: number; // 2 ou 4 níveis
}> = ({ value, onValueChange, primaryColor, levels = 2 }) => {
  const maxValue = levels === 4 ? 3 : 1;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* Container do slider com centralização */}
      <div className="relative w-2 h-16 flex items-center justify-center">
        {/* Barra de fundo centralizada */}
      <div 
          className="absolute w-2 h-16 bg-[#131313] rounded-full"
        style={{ backgroundColor: '#131313' }}
      />
        
        {/* Círculo sólido na extremidade não selecionada */}
        <div 
          className="absolute w-2 h-2 bg-[#131313] rounded-full"
          style={{
            backgroundColor: '#131313',
            top: value === maxValue ? '0px' : '56px', // Topo quando valor máximo, base quando valor mínimo
            left: '0px',
            transform: 'translateY(-50%)'
          }}
      />
      
      {/* Slider customizado */}
      <Slider
        value={[value]}
        onValueChange={(vals) => onValueChange(vals[0])}
          max={maxValue}
        min={0}
        step={1}
        orientation="vertical"
          className="absolute w-2 h-16"
          trackStyle={{
            width: '8px',
            height: '64px',
            backgroundColor: '#131313',
            borderRadius: '4px'
          }}
          rangeStyle={{
            backgroundColor: primaryColor,
            borderRadius: '4px'
          }}
          thumbStyle={{
            width: '16px',
            height: '16px',
            backgroundColor: 'transparent',
            border: `2px solid ${primaryColor}`,
            borderRadius: '50%',
            cursor: 'pointer',
            transform: 'translateX(-4px)'
          }}
          thumbClassName="hover:scale-110 transition-transform"
        />
      </div>
      
      {/* Texto do valor */}
      <span className="text-xs font-medium text-center">
        {getAccessLevelText(value, levels)}
      </span>
    </div>
  );
};

// Modal de criação
export const CreatePermissionModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}> = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const { companyId } = useCrmAuth();
  const effectiveCompanyId = selectedCompanyId || companyId;
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  
  // Estados para modais de times e usuários
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Dados de times e usuários
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: users = [], isLoading: usersLoading } = useCrmUsersByCompany(effectiveCompanyId);

  // Buscar cores da empresa
  const { data: companyBranding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      level: 'Função',
      detail: '',
    }
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setPermissionRows(generatePermissionRows());
    }
  }, [open, form]);

  // Função para obter as opções do campo Detalhamento baseado no nível
  const getDetailOptions = () => {
    const selectedLevel = form.watch('level');
    
    switch (selectedLevel) {
      case 'Função':
        return [
          { value: 'Administrador', label: 'Administrador' },
          { value: 'Líder', label: 'Líder' },
          { value: 'Usuário', label: 'Usuário' }
        ];
      
      case 'Time':
        const teamOptions = teams.map(team => ({
          value: team.id,
          label: team.name
        }));
        return [
          { value: 'add_team', label: '+ Adicionar Time' },
          ...teamOptions
        ];
      
      case 'Usuário':
        const userOptions = users.map(user => ({
          value: user.id,
          label: `${user.first_name} ${user.last_name} (${user.email})`
        }));
        return [
          { value: 'add_user', label: '+ Adicionar Usuário' },
          ...userOptions
        ];
      
      default:
        return [];
    }
  };

  // Função para lidar com a seleção do detalhamento
  const handleDetailChange = (value: string) => {
    if (value === 'add_team') {
      setShowTeamModal(true);
      return;
    }
    
    if (value === 'add_user') {
      setShowUserModal(true);
      return;
    }
    
    form.setValue('detail', value);
  };

  // Função para atualizar uma linha de permissão
  const updatePermissionRow = (rowId: string, field: keyof PermissionRow, value: number) => {
    setPermissionRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await savePermissionToDatabase(data, permissionRows, effectiveCompanyId);
      toast({
        title: "Sucesso!",
        description: "Permissão criada com sucesso!",
        variant: "default",
      });
      onSuccess();
      form.reset();
      setPermissionRows([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar permissão",
        variant: "destructive",
      });
      console.error('Erro ao criar permissão:', error);
    }
  };

  const primaryColor = companyBranding?.primary_color || '#A86F57';

  // console.log('CreatePermissionModal renderizando, open:', open);
  return (
    <>
      <FullScreenModal
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Criar Nova Permissão"
        actions={
          <Button type="submit" form="create-permission-form" variant="brandPrimaryToSecondary" className="brand-radius">
            Criar Permissão
          </Button>
        }
      >
        <Form {...form}>
          <form id="create-permission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
            {/* Linha 1: Nome da Permissão */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Permissão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Administrador CRM" {...field} className="campo-brand brand-radius" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 2: Nível e Detalhamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="select-trigger-brand brand-radius">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Função" className="dropdown-item-brand">Função</SelectItem>
                        <SelectItem value="Time" className="dropdown-item-brand">Time</SelectItem>
                        <SelectItem value="Usuário" className="dropdown-item-brand">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhamento</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={handleDetailChange} 
                        value={field.value}
                        disabled={!form.watch('level')}
                      >
                        <SelectTrigger className="select-trigger-brand brand-radius">
                          <SelectValue placeholder={
                            !form.watch('level') 
                              ? "Selecione primeiro o nível" 
                              : "Selecione o detalhamento"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {getDetailOptions().map(option => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value} 
                              className="dropdown-item-brand"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tabela de Permissões */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuração de Permissões</h3>
              
              <div className="border rounded-lg overflow-hidden brand-radius">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left py-2">Permissão</TableHead>
                      <TableHead className="text-center py-2">Ver</TableHead>
                      <TableHead className="text-center py-2">Editar</TableHead>
                      <TableHead className="text-center py-2">Criar</TableHead>
                      <TableHead className="text-center py-2">Arquivar</TableHead>
                      <TableHead className="text-center py-2">Desativar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2 font-medium">{row.permission}</TableCell>
                        <TableCell className="py-2 text-center">
                            <CustomSlider
                              value={row.view}
                              onValueChange={(value) => updatePermissionRow(row.id, 'view', value)}
                              primaryColor={primaryColor}
                            levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' ? (
                            null /* Coluna Editar vazia para Simulador */
                          ) : (
                            <CustomSlider
                              value={row.edit}
                              onValueChange={(value) => updatePermissionRow(row.id, 'edit', value)}
                              primaryColor={primaryColor}
                              levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' ? (
                            null /* Coluna Criar vazia para Simulador */
                          ) : (
                            <CustomSlider
                              value={row.create}
                              onValueChange={(value) => updatePermissionRow(row.id, 'create', value)}
                              primaryColor={primaryColor}
                              levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' || row.id === 'management' ? (
                            null /* Coluna Arquivar vazia para Simulador e Gestão */
                          ) : (
                            <CustomSlider
                              value={row.archive}
                              onValueChange={(value) => updatePermissionRow(row.id, 'archive', value)}
                              primaryColor={primaryColor}
                              levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' || row.id === 'simulator-config' ? (
                            null /* Coluna Desativar vazia para Simulador e Configurações do Simulador */
                          ) : row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? (
                            null /* Coluna Desativar vazia para Configurações do CRM, Indicadores e Leads */
                          ) : (
                            <CustomSlider
                              value={row.deactivate}
                              onValueChange={(value) => updatePermissionRow(row.id, 'deactivate', value)}
                              primaryColor={primaryColor}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </form>
        </Form>
      </FullScreenModal>

      {/* Modal de Time */}
      <TeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
      />

      {/* Modal de Usuário */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </>
  );
};

// Modal de edição
export const EditPermissionModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  permission: any; // Dados da permissão a ser editada
}> = ({ open, onOpenChange, onSuccess, permission }) => {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  const { companyId } = useCrmAuth();
  const effectiveCompanyId = selectedCompanyId || companyId;
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  
  // Estados para modais de times e usuários
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Dados de times e usuários
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: users = [], isLoading: usersLoading } = useCrmUsersByCompany(effectiveCompanyId);

  // Buscar cores da empresa
  const { data: companyBranding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      level: 'Função',
      detail: '',
    }
  });

  useEffect(() => {
    if (open && permission) {
      // Carregar dados da permissão do banco de dados
      const loadPermissionData = async () => {
        try {
          const { formData, permissionRows: loadedRows } = await loadPermissionForEdit(permission.id);
          
          form.reset({
            name: formData.name,
            level: formData.level as 'Função' | 'Time' | 'Usuário',
            detail: formData.detail,
          });
          
          setPermissionRows(loadedRows);
        } catch (error) {
          console.error('Erro ao carregar dados da permissão:', error);
          // Fallback para dados padrão se houver erro
      form.reset({
        name: permission.name || '',
        level: permission.level || 'Função',
        detail: permission.detail || '',
      });
      setPermissionRows(generatePermissionRows());
        }
      };

      loadPermissionData();
    }
  }, [open, permission, form]);

  // Função para obter as opções do campo Detalhamento baseado no nível
  const getDetailOptions = () => {
    const selectedLevel = form.watch('level');
    
    switch (selectedLevel) {
      case 'Função':
        return [
          { value: 'Administrador', label: 'Administrador' },
          { value: 'Líder', label: 'Líder' },
          { value: 'Usuário', label: 'Usuário' }
        ];
      
      case 'Time':
        const teamOptions = teams.map(team => ({
          value: team.id,
          label: team.name
        }));
        return [
          { value: 'add_team', label: '+ Adicionar Time' },
          ...teamOptions
        ];
      
      case 'Usuário':
        const userOptions = users.map(user => ({
          value: user.id,
          label: `${user.first_name} ${user.last_name} (${user.email})`
        }));
        return [
          { value: 'add_user', label: '+ Adicionar Usuário' },
          ...userOptions
        ];
      
      default:
        return [];
    }
  };

  // Função para lidar com a seleção do detalhamento
  const handleDetailChange = (value: string) => {
    if (value === 'add_team') {
      setShowTeamModal(true);
      return;
    }
    
    if (value === 'add_user') {
      setShowUserModal(true);
      return;
    }
    
    form.setValue('detail', value);
  };

  // Função para atualizar uma linha de permissão
  const updatePermissionRow = (rowId: string, field: keyof PermissionRow, value: number) => {
    setPermissionRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Usar a função compartilhada diretamente
      await updatePermissionInDatabase(permission.id, data, permissionRows);
      toast({
        title: "Sucesso!",
        description: "Permissão atualizada com sucesso!",
        variant: "default",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
      console.error('Erro ao atualizar permissão:', error);
    }
  };

  const primaryColor = companyBranding?.primary_color || '#A86F57';

  return (
    <>
      <FullScreenModal
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Editar Permissão"
        actions={
          <Button type="submit" form="edit-permission-form" variant="brandPrimaryToSecondary" className="brand-radius">
            Salvar Alterações
          </Button>
        }
      >
        <Form {...form}>
          <form id="edit-permission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
            {/* Linha 1: Nome da Permissão */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Permissão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Administrador CRM" {...field} className="campo-brand brand-radius" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 2: Nível e Detalhamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="select-trigger-brand brand-radius">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Função" className="dropdown-item-brand">Função</SelectItem>
                        <SelectItem value="Time" className="dropdown-item-brand">Time</SelectItem>
                        <SelectItem value="Usuário" className="dropdown-item-brand">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhamento</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={handleDetailChange} 
                        value={field.value}
                        disabled={!form.watch('level')}
                      >
                        <SelectTrigger className="select-trigger-brand brand-radius">
                          <SelectValue placeholder={
                            !form.watch('level') 
                              ? "Selecione primeiro o nível" 
                              : "Selecione o detalhamento"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {getDetailOptions().map(option => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value} 
                              className="dropdown-item-brand"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tabela de Permissões */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuração de Permissões</h3>
              
              <div className="border rounded-lg overflow-hidden brand-radius">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left py-2">Permissão</TableHead>
                      <TableHead className="text-center py-2">Ver</TableHead>
                      <TableHead className="text-center py-2">Editar</TableHead>
                      <TableHead className="text-center py-2">Criar</TableHead>
                      <TableHead className="text-center py-2">Arquivar</TableHead>
                      <TableHead className="text-center py-2">Desativar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2 font-medium">{row.permission}</TableCell>
                        <TableCell className="py-2 text-center">
                            <CustomSlider
                              value={row.view}
                              onValueChange={(value) => updatePermissionRow(row.id, 'view', value)}
                              primaryColor={primaryColor}
                            levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' ? (
                            null /* Coluna Editar vazia para Simulador */
                          ) : (
                            <CustomSlider
                              value={row.edit}
                              onValueChange={(value) => updatePermissionRow(row.id, 'edit', value)}
                              primaryColor={primaryColor}
                              levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' ? (
                            null /* Coluna Criar vazia para Simulador */
                          ) : (
                            <CustomSlider
                              value={row.create}
                              onValueChange={(value) => updatePermissionRow(row.id, 'create', value)}
                              primaryColor={primaryColor}
                              levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' || row.id === 'management' ? (
                            null /* Coluna Arquivar vazia para Simulador e Gestão */
                          ) : (
                            <CustomSlider
                              value={row.archive}
                              onValueChange={(value) => updatePermissionRow(row.id, 'archive', value)}
                              primaryColor={primaryColor}
                              levels={row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? 4 : 2}
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {row.id === 'simulator' || row.id === 'simulator-config' ? (
                            null /* Coluna Desativar vazia para Simulador e Configurações do Simulador */
                          ) : row.id === 'crm-config' || row.id === 'indicators' || row.id === 'leads' ? (
                            null /* Coluna Desativar vazia para Configurações do CRM, Indicadores e Leads */
                          ) : (
                            <CustomSlider
                              value={row.deactivate}
                              onValueChange={(value) => updatePermissionRow(row.id, 'deactivate', value)}
                              primaryColor={primaryColor}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </form>
        </Form>
      </FullScreenModal>

      {/* Modal de Time */}
      <TeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
      />

      {/* Modal de Usuário */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </>
  );
}; 