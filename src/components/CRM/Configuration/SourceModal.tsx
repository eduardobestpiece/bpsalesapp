
import { useState, useEffect } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSource, useUpdateSource } from '@/hooks/useSources';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: any;
}

export const SourceModal = ({ isOpen, onClose, source }: SourceModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const createSourceMutation = useCreateSource();
  const updateSourceMutation = useUpdateSource();

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
      });
    } else {
      setFormData({
        name: '',
      });
    }
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da origem é obrigatório');
      return;
    }

    if (!companyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setIsLoading(true);

    try {
      if (source) {
        // Editar origem existente
        await updateSourceMutation.mutateAsync({
          id: source.id,
          name: formData.name.trim(),
          company_id: selectedCompanyId || companyId,
          status: 'active'
        });
        toast.success('Origem atualizada com sucesso!');
      } else {
        // Criar nova origem
        await createSourceMutation.mutateAsync({
          name: formData.name.trim(),
          company_id: selectedCompanyId || companyId,
          status: 'active'
        });
        toast.success('Origem criada com sucesso!');
      }

      onClose();
      setFormData({ name: '' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar origem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={source ? 'Editar Origem' : 'Nova Origem'}
      actions={<Button type="submit" form="source-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (source ? 'Atualizar' : 'Criar')}</Button>}
    >
        <form id="source-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Origem *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Site, Indicação, Redes Sociais"
              required
              disabled={isLoading}
              className="campo-brand brand-radius"
            />
          </div>
 
          <div className="flex justify-end space-x-2 pt-4"></div>
        </form>
    </FullScreenModal>
  );
};
