import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { FullScreenModal } from '@/components/ui/FullScreenModal';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  level: z.enum(['Função', 'Time', 'Usuário']),
  detail: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Dados para os dropdowns
const MODULES = ['CRM', 'Simulador', 'Configurações'];

const PAGES_BY_MODULE = {
  'CRM': ['Dashboard', 'Leads', 'Vendas', 'Indicadores', 'Agenda', 'Perfil'],
  'Simulador': ['Simulador', 'Resultados', 'Configurações'],
  'Configurações': ['Empresa', 'Usuários', 'Permissões', 'Master Config']
};

const TABS_BY_PAGE = {
  'Dashboard': ['Visão Geral', 'Métricas'],
  'Leads': ['Todos os Leads', 'Meus Leads', 'Novo Lead'],
  'Vendas': ['Todas as Vendas', 'Minhas Vendas', 'Nova Venda'],
  'Indicadores': ['Performance', 'Registro'],
  'Agenda': ['Calendário', 'Eventos'],
  'Perfil': ['Dados Pessoais', 'Integrações'],
  'Simulador': ['Simulação', 'Histórico'],
  'Resultados': ['Análise', 'Comparação'],
  'Configurações': ['Geral', 'Avançado'],
  'Empresa': ['Dados', 'Branding'],
  'Usuários': ['Lista', 'Permissões'],
  'Permissões': ['Funções', 'Times'],
  'Master Config': ['Empresas', 'Permissões']
};

const PERMISSION_LEVELS = ['Empresa', 'Time', 'Pessoal', 'Nenhuma'];

// Interface para as permissões da tabela
interface PermissionRow {
  id: string;
  module: string;
  page: string;
  tab: string;
  view: string;
  create: string;
  edit: string;
  archive: string;
  deactivate: string;
}

// Modal de criação
export const CreatePermissionModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}> = ({ open, onOpenChange, onSuccess }) => {
  const { selectedCompanyId } = useCompany();
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);

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
      setSelectedModule('');
      setSelectedPage('');
      setPermissionRows([]);
    }
  }, [open, form]);

  // Gerar linhas de permissão baseadas no módulo e página selecionados
  const generatePermissionRows = (module: string, page: string) => {
    const tabs = TABS_BY_PAGE[page as keyof typeof TABS_BY_PAGE] || [];
    
    const rows: PermissionRow[] = tabs.map((tab, index) => ({
      id: `${module}-${page}-${tab}-${index}`,
      module,
      page,
      tab,
      view: 'Empresa',
      create: 'Nenhuma',
      edit: 'Nenhuma',
      archive: 'Nenhuma',
      deactivate: 'Nenhuma'
    }));

    setPermissionRows(rows);
  };

  const handleModuleChange = (module: string) => {
    setSelectedModule(module);
    setSelectedPage('');
    setPermissionRows([]);
  };

  const handlePageChange = (page: string) => {
    setSelectedPage(page);
    generatePermissionRows(selectedModule, page);
  };

  const updatePermissionRow = (rowId: string, field: keyof PermissionRow, value: string) => {
    setPermissionRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Aqui você implementaria a lógica para salvar as permissões
      console.log('Dados do formulário:', data);
      console.log('Permissões da tabela:', permissionRows);
      
      toast.success('Permissão criada com sucesso!');
      onSuccess();
      form.reset();
      setPermissionRows([]);
    } catch (error) {
      toast.error('Erro ao salvar permissão');
    }
  };

  console.log('CreatePermissionModal renderizando, open:', open);
  return (
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
        <form id="create-permission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Input placeholder="Descrição detalhada da permissão" {...field} className="campo-brand brand-radius" />
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
                    <TableHead className="text-left py-2">Aba</TableHead>
                    <TableHead className="text-left py-2">Página</TableHead>
                    <TableHead className="text-left py-2">Módulo</TableHead>
                    <TableHead className="text-center py-2">Ver</TableHead>
                    <TableHead className="text-center py-2">Criar</TableHead>
                    <TableHead className="text-center py-2">Editar</TableHead>
                    <TableHead className="text-center py-2">Arquivar</TableHead>
                    <TableHead className="text-center py-2">Desativar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma configuração de permissão disponível.
                        <br />
                        <span className="text-sm">Configure módulos e páginas para definir permissões específicas.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissionRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2">{row.tab}</TableCell>
                        <TableCell className="py-2">{row.page}</TableCell>
                        <TableCell className="py-2">{row.module}</TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.view} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'view', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.create} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'create', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.edit} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'edit', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.archive} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'archive', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.deactivate} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'deactivate', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </form>
      </Form>
    </FullScreenModal>
  );
};

// Modal de edição
export const EditPermissionModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  permission: any; // Dados da permissão a ser editada
}> = ({ open, onOpenChange, onSuccess, permission }) => {
  const { selectedCompanyId } = useCompany();
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);

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
      form.reset({
        name: permission.name || '',
        level: permission.level || 'Função',
        detail: permission.detail || '',
      });
      // Aqui você carregaria os dados das permissões da tabela
      setSelectedModule(permission.module || '');
      setSelectedPage(permission.page || '');
      // setPermissionRows(permission.rows || []);
    }
  }, [open, permission, form]);

  const handleModuleChange = (module: string) => {
    setSelectedModule(module);
    setSelectedPage('');
    setPermissionRows([]);
  };

  const handlePageChange = (page: string) => {
    setSelectedPage(page);
    // Gerar ou carregar as linhas de permissão
  };

  const updatePermissionRow = (rowId: string, field: keyof PermissionRow, value: string) => {
    setPermissionRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Aqui você implementaria a lógica para atualizar as permissões
      console.log('Dados do formulário:', data);
      console.log('Permissões da tabela:', permissionRows);
      
      toast.success('Permissão atualizada com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao atualizar permissão');
    }
  };

  return (
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
        <form id="edit-permission-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Input placeholder="Descrição detalhada da permissão" {...field} className="campo-brand brand-radius" />
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
                    <TableHead className="text-left py-2">Aba</TableHead>
                    <TableHead className="text-left py-2">Página</TableHead>
                    <TableHead className="text-left py-2">Módulo</TableHead>
                    <TableHead className="text-center py-2">Ver</TableHead>
                    <TableHead className="text-center py-2">Criar</TableHead>
                    <TableHead className="text-center py-2">Editar</TableHead>
                    <TableHead className="text-center py-2">Arquivar</TableHead>
                    <TableHead className="text-center py-2">Desativar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma configuração de permissão disponível.
                        <br />
                        <span className="text-sm">Configure módulos e páginas para definir permissões específicas.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissionRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2">{row.tab}</TableCell>
                        <TableCell className="py-2">{row.page}</TableCell>
                        <TableCell className="py-2">{row.module}</TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.view} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'view', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.create} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'create', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.edit} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'edit', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.archive} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'archive', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Select 
                            value={row.deactivate} 
                            onValueChange={(value) => updatePermissionRow(row.id, 'deactivate', value)}
                          >
                            <SelectTrigger className="w-28 select-trigger-brand brand-radius">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_LEVELS.map(level => (
                                <SelectItem key={level} value={level} className="dropdown-item-brand">{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </form>
      </Form>
    </FullScreenModal>
  );
}; 