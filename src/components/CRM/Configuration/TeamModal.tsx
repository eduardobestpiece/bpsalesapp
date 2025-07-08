
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { toast } from 'sonner';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  team?: any;
}

export const TeamModal = ({ isOpen, onClose, companyId, team }: TeamModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    leader_id: '',
  });

  const { data: users = [] } = useCrmUsers(companyId);
  const leaders = users.filter(user => user.role === 'leader' || user.role === 'admin' || user.role === 'master');

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

    console.log('Dados do time:', formData);
    toast.success(team ? 'Time atualizado com sucesso!' : 'Time criado com sucesso!');
    onClose();
    setFormData({ name: '', leader_id: '' });
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
            />
          </div>

          <div>
            <Label htmlFor="leader">Líder do Time *</Label>
            <Select
              value={formData.leader_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, leader_id: value }))}
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {team ? 'Atualizar' : 'Criar Time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
