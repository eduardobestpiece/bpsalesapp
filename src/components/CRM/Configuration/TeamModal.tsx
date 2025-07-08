
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: any;
}

export const TeamModal = ({ isOpen, onClose, team }: TeamModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    leader_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { companyId } = useCrmAuth();
  const { data: users = [] } = useCrmUsers();
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  // Filtrar usuários que podem ser líderes
  const leaders = users.filter(user => 
    user.role === 'leader' || user.role === 'admin' || user.role === 'master'
  );

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        leader_id: team.leader_id,
      });
    } else {
      setFormData({
        name: '',
        leader_id: '',
      });
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do time é obrigatório');
      return;
    }

    if (!formData.leader_id) {
      toast.error('Líder do time é obrigatório');
      return;
    }

    if (!companyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setIsLoading(true);

    try {
      if (team) {
        // Editar time existente
        await updateTeamMutation.mutateAsync({
          id: team.id,
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: companyId,
          status: 'active'
        });
        toast.success('Time atualizado com sucesso!');
      } else {
        // Criar novo time
        await createTeamMutation.mutateAsync({
          name: formData.name.trim(),
          leader_id: formData.leader_id,
          company_id: companyId,
          status: 'active'
        });
        toast.success('Time criado com sucesso!');
      }

      onClose();
      setFormData({ name: '', leader_id: '' });
    } catch (error: any) {
      console.error('Erro ao salvar time:', error);
      toast.error(error.message || 'Erro ao salvar time');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {team ? 'Editar Time' : 'Novo Time'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Time *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Equipe Vendas"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="leader">Líder do Time *</Label>
            <Select
              value={formData.leader_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, leader_id: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o líder" />
              </SelectTrigger>
              <SelectContent>
                {leaders.map(leader => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.first_name} {leader.last_name} ({leader.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (team ? 'Atualizar' : 'Criar Time')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
