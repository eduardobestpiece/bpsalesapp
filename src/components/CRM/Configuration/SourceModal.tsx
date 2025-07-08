
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  source?: any;
}

export const SourceModal = ({ isOpen, onClose, companyId, source }: SourceModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
  });

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

    console.log('Dados da origem:', formData);
    toast.success(source ? 'Origem atualizada com sucesso!' : 'Origem criada com sucesso!');
    onClose();
    setFormData({ name: '' });
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
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {source ? 'Atualizar' : 'Criar Origem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
