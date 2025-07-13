
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  sale?: any;
}

export const SaleModal = ({ isOpen, onClose, companyId, sale }: SaleModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {sale ? 'Editar Venda' : 'Nova Venda'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-6xl">🚧</div>
          <h3 className="text-xl font-semibold">Em breve</h3>
          <p className="text-muted-foreground text-center">
            Esta funcionalidade estará disponível em breve.
          </p>
          
          <Button onClick={onClose} className="mt-6">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
