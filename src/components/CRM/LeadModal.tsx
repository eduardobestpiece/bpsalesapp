
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  lead?: any;
  disabled?: boolean;
}

export const LeadModal = ({ isOpen, onClose, companyId, lead, disabled = false }: LeadModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-6xl">🚧</div>
          <h3 className="text-xl font-semibold">Em breve</h3>
          <p className="text-muted-foreground text-center">
            Esta funcionalidade estará disponível em breve.
          </p>
          
          <Button onClick={onClose} className="mt-6" disabled={disabled}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
