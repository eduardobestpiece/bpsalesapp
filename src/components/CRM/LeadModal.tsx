import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateLead, useCrmUsers, useFunnels, useSources } from '@/hooks/useCrmData';
import { toast } from 'sonner';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export const LeadModal = ({ isOpen, onClose, companyId }: LeadModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    responsible_id: '',
    funnel_id: '',
    source_id: '',
  });

  const createLead = useCreateLead();
  const { data: users = [] } = useCrmUsers(companyId);
  const { data: funnels = [] } = useFunnels(companyId);
  const { data: sources = [] } = useSources(companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.responsible_id || !formData.funnel_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      // Get the first stage of the selected funnel
      const selectedFunnel = funnels.find(f => f.id === formData.funnel_id);
      if (!selectedFunnel || !selectedFunnel.stages || selectedFunnel.stages.length === 0) {
        toast.error('Funil selecionado não possui etapas configuradas');
        return;
      }

      const firstStage = selectedFunnel.stages.find(s => s.stage_order === 1);
      if (!firstStage) {
        toast.error('Funil selecionado não possui primeira etapa');
        return;
      }

      await createLead.mutateAsync({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        responsible_id: formData.responsible_id,
        funnel_id: formData.funnel_id,
        current_stage_id: firstStage.id,
        source_id: formData.source_id || undefined,
        company_id: companyId,
        status: 'active' as const,
      });

      toast.success('Lead criado com sucesso!');
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        responsible_id: '',
        funnel_id: '',
        source_id: '',
      });
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do lead"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="responsible">Responsável *</Label>
            <Select value={formData.responsible_id} onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="funnel">Funil *</Label>
            <Select value={formData.funnel_id} onValueChange={(value) => setFormData(prev => ({ ...prev, funnel_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {funnels.map(funnel => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source">Origem</Label>
            <Select value={formData.source_id} onValueChange={(value) => setFormData(prev => ({ ...prev, source_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {sources.map(source => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
