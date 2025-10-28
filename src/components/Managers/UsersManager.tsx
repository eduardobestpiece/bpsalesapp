import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, UserPlus, Shield } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'master' | 'admin' | 'leader' | 'user';
  status: 'active' | 'archived';
  created_at: string;
}

interface UsersManagerProps {
  companyId: string;
}

export function UsersManager({ companyId }: UsersManagerProps) {
  const { crmUser } = useCrmAuth();
  const queryClient = useQueryClient();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Estados do formulário de novo usuário
  const [newUserData, setNewUserData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user' as 'master' | 'admin' | 'leader' | 'user',
  });

  // Buscar usuários da empresa
  const { data: users, isLoading } = useQuery({
    queryKey: ['company_users', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, email, first_name, last_name, role, status, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    }
  });

  // Mutação para criar usuário usando Edge Function
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const response = await fetch('https://hpjqetugksblfiojwhzh.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwanFldHVna3NibGZpb2p3aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzA5NDgsImV4cCI6MjA3NTAwNjk0OH0.FHkiqYWD6kbHNlNfbp3Gasi1RGpel7erVAx98hkfl0c',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwanFldHVna3NibGZpb2p3aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzA5NDgsImV4cCI6MjA3NTAwNjk0OH0.FHkiqYWD6kbHNlNfbp3Gasi1RGpel7erVAx98hkfl0c',
        },
        body: JSON.stringify({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          company_id: companyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_users', companyId] });
      setIsAddUserModalOpen(false);
      setNewUserData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'user',
      });
      toast.success('Usuário criado com sucesso! Email de confirmação enviado.');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    }
  });

  // Mutação para alterar status do usuário
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'active' | 'archived' }) => {
      // Verificar se o usuário é Master antes de desativar
      if (newStatus === 'archived') {
        const { data: targetUser } = await supabase
          .from('crm_users')
          .select('role')
          .eq('id', userId)
          .single();

        if (targetUser?.role === 'master') {
          throw new Error('Usuários Master nunca podem ser desativados');
        }
      }

      const { error } = await supabase
        .from('crm_users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_users', companyId] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  // Mutação para definir senha do usuário
  const setPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      // Chamar Edge Function para definir senha
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/set-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({ 
          user_id: userId,
          password: password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao definir senha');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      setIsSetPasswordModalOpen(false);
      setSelectedUserForPassword(null);
      setNewPassword('');
      toast.success('Senha definida com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao definir senha: ' + error.message);
    }
  });

  // Mutação para excluir usuário (completa: crm_users + auth.users)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Obter ID do usuário atual para verificação de permissões
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar ID do usuário atual na tabela crm_users
      const { data: currentCrmUser } = await supabase
        .from('crm_users')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!currentCrmUser) {
        throw new Error('Usuário atual não encontrado na tabela crm_users');
      }

      // Chamar Edge Function para exclusão completa
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({ 
          user_id: userId,
          requesting_user_id: currentCrmUser.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_users', companyId] });
      toast.success('Usuário excluído com sucesso de todas as tabelas!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir usuário: ' + error.message);
    }
  });

  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'archived') => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    toggleUserStatusMutation.mutate({ userId, newStatus });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      setIsDeletingUserId(userId);
      deleteUserMutation.mutate(userId, {
        onSettled: () => setIsDeletingUserId(null)
      });
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.email || !newUserData.first_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  const handleSetPassword = (user: User) => {
    setSelectedUserForPassword(user);
    setIsSetPasswordModalOpen(true);
  };

  const handleConfirmSetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (!selectedUserForPassword) return;
    
    setPasswordMutation.mutate({ 
      userId: selectedUserForPassword.id, 
      password: newPassword 
    });
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      master: 'Master',
      admin: 'Administrador',
      leader: 'Líder',
      user: 'Colaborador'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const canManageUsers = crmUser?.role === 'master' || crmUser?.role === 'admin';
  const canSetPassword = crmUser?.role === 'master';

  if (!canManageUsers) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Você não tem permissão para gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usuários</h3>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da empresa</p>
        </div>
        <Button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="brand-radius"
          variant="brandPrimaryToSecondary"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{getRoleLabel(user.role)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.status === 'active'}
                        onCheckedChange={() => handleToggleStatus(user.id, user.status)}
                        disabled={user.role === 'master' || toggleUserStatusMutation.isPending}
                      />
                      <span className="text-sm">
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      {user.role === 'master' && (
                        <span className="text-xs text-muted-foreground">(Protegido)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {/* Botão para definir senha - apenas para master */}
                      {canSetPassword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPassword(user)}
                          disabled={setPasswordMutation.isPending}
                          className="text-[#333333] hover:text-[#555555]"
                          title="Definir senha do usuário"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={
                          isDeletingUserId === user.id || 
                          user.role === 'master' ||
                          user.id === crmUser?.id
                        }
                        className="text-destructive hover:text-destructive disabled:opacity-50"
                        title={
                          user.role === 'master' 
                            ? 'Usuários Master não podem ser excluídos'
                            : user.id === crmUser?.id
                            ? 'Você não pode se excluir'
                            : 'Excluir usuário'
                        }
                      >
                        {isDeletingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      {(user.role === 'master' || user.id === crmUser?.id) && (
                        <span className="text-xs text-muted-foreground">
                          {user.role === 'master' ? 'Protegido' : 'Você mesmo'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal para adicionar usuário */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <p className="text-sm text-muted-foreground">
              O usuário receberá um email de confirmação para definir sua senha e acessar a plataforma.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={newUserData.first_name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  value={newUserData.last_name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select 
                value={newUserData.role} 
                onValueChange={(value: 'master' | 'admin' | 'leader' | 'user') => 
                  setNewUserData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Colaborador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  {crmUser?.role === 'master' && (
                    <SelectItem value="master">Master</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserModalOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="brand-radius"
              variant="brandPrimaryToSecondary"
            >
              {createUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para definir senha */}
      <Dialog open={isSetPasswordModalOpen} onOpenChange={setIsSetPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#333333]" />
              Definir Senha do Usuário
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Definindo senha para: <strong>{selectedUserForPassword?.first_name} {selectedUserForPassword?.last_name}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Email: <strong>{selectedUserForPassword?.email}</strong>
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha *</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 6 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSetPasswordModalOpen(false);
                setSelectedUserForPassword(null);
                setNewPassword('');
              }}
              disabled={setPasswordMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmSetPassword}
              disabled={setPasswordMutation.isPending || !newPassword}
              className="brand-radius"
              variant="brandPrimaryToSecondary"
            >
              {setPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {setPasswordMutation.isPending ? 'Definindo...' : 'Definir Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
