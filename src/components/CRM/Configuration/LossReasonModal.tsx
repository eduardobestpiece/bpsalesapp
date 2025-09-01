import { useState, useEffect } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateLossReason, useUpdateLossReason } from '@/hooks/useLossReasons';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type LossReason = Tables<'loss_reasons'>;

interface LossReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lossReason?: LossReason | null;
}

export function LossReasonModal({ isOpen, onClose, lossReason }: LossReasonModalProps) {
  const { selectedCompanyId } = useCompany();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const createLossReasonMutation = useCreateLossReason();
  const updateLossReasonMutation = useUpdateLossReason();

  const isEditing = !!lossReason;

  useEffect(() => {
    if (lossReason) {
      setFormData({
        name: lossReason.name || '',
        description: lossReason.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [lossReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && lossReason) {
        await updateLossReasonMutation.mutateAsync({
          id: lossReason.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          company_id: selectedCompanyId,
          status: 'active'
        });
        toast.success('Motivo de perda atualizado com sucesso!');
      } else {
        await createLossReasonMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim(),
          company_id: selectedCompanyId,
          status: 'active'
        });
        toast.success('Motivo de perda criado com sucesso!');
      }
      onClose();
      setFormData({ name: '', description: '' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar motivo de perda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Motivo de Perda' : 'Novo Motivo de Perda'}
      actions={<Button type="submit" form="loss-reason-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}</Button>}
    >
      <form id="loss-reason-form" onSubmit={handleSubmit} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
        <div>
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Digite o nome do motivo de perda"
            required
            disabled={isLoading}
            className="campo-brand brand-radius"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Digite uma descrição para o motivo de perda"
            rows={4}
            disabled={isLoading}
            className="campo-brand brand-radius"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4"></div>
      </form>
    </FullScreenModal>
  );
} 