
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateCrmUser } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTeams } from '@/hooks/useTeams';
import { TeamModal } from './TeamModal';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';


interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export const UserModal = ({ isOpen, onClose, user }: UserModalProps) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'user' as 'master' | 'admin' | 'leader' | 'user',
    team_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [showTeamModal, setShowTeamModal] = useState(false);

  const { companyId, crmUser } = useCrmAuth();
  const updateUserMutation = useUpdateCrmUser();
  const { data: teams = [] } = useTeams();
  
  // Buscar empresas
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

  // Verificar se o usuário atual pode criar administradores
  const canCreateAdmin = crmUser?.role === 'master' || crmUser?.role === 'admin';
  const canCreateSubMaster = crmUser?.role === 'master';

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        team_id: user.team_id || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'user',
        team_id: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[UserModal] ===== INÍCIO DO SUBMIT =====');
    console.log('[UserModal] FormData atual:', formData);
    console.log('[UserModal] Usuário sendo editado:', user);
    
    if (!formData.email || !formData.first_name || !formData.last_name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validação específica para líder
    if (formData.role === 'leader' && !formData.team_id) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um time para o líder.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (user) {
        // Atualizar usuário existente
        console.log('[UserModal] Atualizando usuário existente...');
        console.log('[UserModal] Dados para atualização:', { id: user.id, ...formData });
        console.log('[UserModal] team_id específico:', formData.team_id);
        console.log('[UserModal] role específico:', formData.role);
        
        const updateData = {
          id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
          team_id: formData.team_id,
          company_id: formData.company_id,
          status: formData.status
        };
        
        console.log('[UserModal] Dados finais para update:', updateData);
        
        const result = await updateUserMutation.mutateAsync(updateData);
        console.log('[UserModal] Resultado da mutação:', result);
        
        // Atualizar o leader_id na tabela teams se o usuário for líder
        if (formData.role === 'leader' && formData.team_id) {
          console.log('[UserModal] Atualizando leader_id na tabela teams...');
          try {
            await supabase
              .from('teams')
              .update({ leader_id: user.id })
              .eq('id', formData.team_id);
            console.log(`[UserModal] Time ${formData.team_id} atualizado com líder ${user.id}`);
          } catch (teamError) {
            console.error('[UserModal] Erro ao atualizar líder do time:', teamError);
          }
        }
        
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
        
        console.log('[UserModal] Forçando atualização da lista de usuários');
        onClose();
      } else {
        // Criar novo usuário
        console.log('[UserModal] Criando novo usuário...');
        const inviteData = {
          email: formData.email,
          role: formData.role,
          funnels: formData.funnels,
          company_id: formData.company_id,
          team_id: formData.team_id
        };
        
        console.log('[UserModal] Dados para convite:', inviteData);

        const { data, error } = await supabase.functions.invoke('invite-user', {
          body: inviteData,
        });

        if (error) {
          console.error('[UserModal] Erro no convite:', error);
          throw error;
        }

        console.log('[UserModal] Resposta do convite:', data);

        // Atualizar o leader_id na tabela teams se o usuário for líder
        if (formData.role === 'leader' && formData.team_id && data?.user?.id) {
          console.log('[UserModal] Atualizando leader_id para novo usuário...');
          try {
            await supabase
              .from('teams')
              .update({ leader_id: data.user.id })
              .eq('id', formData.team_id);
            console.log(`[UserModal] Time ${formData.team_id} atualizado com líder ${data.user.id}`);
          } catch (teamError) {
            console.error('[UserModal] Erro ao atualizar líder do time:', teamError);
          }
        }

        toast({
          title: "Sucesso",
          description: "Convite enviado com sucesso!",
        });
        onClose();
      }
    } catch (error) {
      console.error('[UserModal] Erro no submit:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar usuário. Tente novamente.",
        variant: "destructive",
      });
    }
    
    console.log('[UserModal] ===== FIM DO SUBMIT =====');
  };

  const handleTeamCreated = (newTeam: any) => {
    // Atualizar o formData com o novo time criado
    setFormData(prev => ({ ...prev, team_id: newTeam.id }));
    setShowTeamModal(false);
    toast.success('Time criado com sucesso!');
  };

  return (
    <>
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Editar Usuário' : 'Novo Usuário'}
      actions={<Button type="submit" form="user-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (user ? 'Atualizar' : 'Convidar')}</Button>}
    >
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
          {/* Seleção de empresa */}
          {crmUser?.role === 'master' && (
            <div>
              <Label htmlFor="company_id">Empresa *</Label>
              <Select
                value={selectedCompanyId || companyId || ''}
                onValueChange={(value) => setSelectedCompanyId(value)}
                disabled={isLoading || companiesLoading}
                required
              >
                <SelectTrigger className="select-trigger-brand brand-radius">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companiesLoading ? (
                    <div className="px-4 py-2 text-muted-foreground text-sm">Carregando empresas...</div>
                  ) : companies.length > 0 ? (
                    companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="dropdown-item-brand">{c.name}</SelectItem>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-muted-foreground text-sm">Nenhuma empresa encontrada</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {user && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  disabled={isLoading}
                  className="campo-brand brand-radius"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  disabled={isLoading}
                  className="campo-brand brand-radius"
                />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isLoading || !!user}
              className="campo-brand brand-radius"
            />
            {user && (
              <p className="text-xs text-muted-foreground mt-1">
                O email não pode ser alterado após a criação
              </p>
            )}
          </div>
          {user && (
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                disabled={isLoading}
                className="campo-brand brand-radius"
              />
            </div>
          )}
          {/* Seleção de papel */}
          <div>
            <Label htmlFor="role">Papel *</Label>
            <Select
              value={formData.role}
                onValueChange={(value) => {
                  setFormData((prev) => ({ 
                    ...prev, 
                    role: value as any,
                    // Limpar team_id se não for leader
                    team_id: value === 'leader' ? prev.team_id : ''
                  }));
                }}
              disabled={isLoading}
              required
            >
              <SelectTrigger className="select-trigger-brand brand-radius">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user" className="dropdown-item-brand">Usuário</SelectItem>
                  <SelectItem value="leader" className="dropdown-item-brand">Líder</SelectItem>
                {canCreateAdmin && <SelectItem value="admin" className="dropdown-item-brand">Administrador</SelectItem>}
                {canCreateSubMaster && <SelectItem value="submaster" className="dropdown-item-brand">SubMaster (visualização total, sem edição)</SelectItem>}
                {crmUser?.role === 'master' && <SelectItem value="master" className="dropdown-item-brand">Master</SelectItem>}
              </SelectContent>
            </Select>
          </div>

            {/* Seleção de time (apenas para líderes) */}
            {formData.role === 'leader' && (
              <div>
                <Label htmlFor="team_id">Time *</Label>
                <Select
                  value={formData.team_id}
                  onValueChange={(value) => {
                    if (value === 'create') {
                      setShowTeamModal(true);
                    } else {
                      setFormData(prev => ({ ...prev, team_id: value }));
                    }
                  }}
                  disabled={isLoading}
                  required
                >
                  <SelectTrigger className="select-trigger-brand brand-radius">
                    <SelectValue placeholder="Selecione o time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create" className="dropdown-item-brand">
                      + Criar time
                    </SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id} className="dropdown-item-brand">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          <div className="flex justify-end space-x-2 pt-4"></div>
        </form>
    </FullScreenModal>

      {/* Modal para criar time */}
      <TeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={handleTeamCreated}
      />
    </>
  );
};

