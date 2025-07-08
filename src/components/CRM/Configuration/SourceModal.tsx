
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSource, useUpdateSource } from '@/hooks/useSources';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';

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
          company_id: companyId,
          status: 'active'
        });
        toast.success('Origem atualizada com sucesso!');
      } else {
        // Criar nova origem
        await createSourceMutation.mutateAsync({
          name: formData.name.trim(),
          company_id: companyId,
          status: 'active'
        });
        toast.success('Origem criada com sucesso!');
      }

      onClose();
      setFormData({ name: '' });
    } catch (error: any) {
      console.error('Erro ao salvar origem:', error);
      toast.error(error.message || 'Erro ao salvar origem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {source ? 'Editar Origem' : 'Nova Origem'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Origem *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Site, Indicação, Redes Sociais"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (source ? 'Atualizar' : 'Criar Origem')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
