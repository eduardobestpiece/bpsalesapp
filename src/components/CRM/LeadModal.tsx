
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  lead?: any;
}

export const LeadModal = ({ isOpen, onClose, companyId, lead }: LeadModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Construction className="w-16 h-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Em Breve</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade estará disponível em breve.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
