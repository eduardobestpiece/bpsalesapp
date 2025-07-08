import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSale, useLeads, useCrmUsers } from '@/hooks/useCrmData';
import { toast } from 'sonner';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export const SaleModal = ({ isOpen, onClose, companyId }: SaleModalProps) => {
  const [formData, setFormData] = useState({
    lead_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    sale_value: '',
    responsible_id: '',
  });

  const createSale = useCreateSale();
  const { data: leads = [] } = useLeads(companyId);
  const { data: users = [] } = useCrmUsers(companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lead_id || !formData.sale_date || !formData.sale_value || !formData.responsible_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createSale.mutateAsync({
        lead_id: formData.lead_id,
        sale_date: formData.sale_date,
        sale_value: parseFloat(formData.sale_value),
        responsible_id: formData.responsible_id,
        company_id: companyId,
        status: 'active' as const,
      });

      toast.success('Venda registrada com sucesso!');
      onClose();
      setFormData({
        lead_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_value: '',
        responsible_id: '',
      });
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      toast.error('Erro ao registrar venda');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Nova Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lead">Lead *</Label>
            <Select value={formData.lead_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sale_date">Data da Venda *</Label>
            <Input
              id="sale_date"
              type="date"
              value={formData.sale_date}
              onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="sale_value">Valor da Venda (R$) *</Label>
            <Input
              id="sale_value"
              type="number"
              step="0.01"
              min="0"
              value={formData.sale_value}
              onChange={(e) => setFormData(prev => ({ ...prev, sale_value: e.target.value }))}
              placeholder="0,00"
              required
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSale.isPending}>
              {createSale.isPending ? 'Registrando...' : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
