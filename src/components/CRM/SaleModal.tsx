
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {sale ? 'Editar Venda' : 'Nova Venda'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚧</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Em breve</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade estará disponível em breve. Estamos trabalhando para trazer a melhor experiência de gestão de vendas.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
