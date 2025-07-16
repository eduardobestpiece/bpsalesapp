
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, User } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { SaleModal } from './SaleModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface SalesListProps {
  companyId: string;
}

export const SalesList = ({ companyId }: SalesListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: sales = [], isLoading } = useSales();
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';

  const handleEdit = (sale: any) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_date?.includes(searchTerm) ||
    sale.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.sale_value?.toString().includes(searchTerm) ||
    `${sale.responsible?.first_name} ${sale.responsible?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.team?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando vendas...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vendas</CardTitle>
              <CardDescription>
                Gerencie suas vendas e resultados
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)} disabled={isSubMaster}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar venda..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
              disabled={isSubMaster}
            />
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div>Carregando...</div>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border border-border dark:border-[#A86F57]/20 bg-card dark:bg-[#1F1F1F] rounded p-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary dark:text-[#A86F57]" />
                    <span className="font-medium text-foreground dark:text-white">{sale.lead?.name}</span>
                    <Badge variant="outline" className="border-border dark:border-[#A86F57]/30 text-foreground dark:text-white">{sale.sale_value}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(sale)}
                      disabled={isSubMaster}
                      className="border-border dark:border-[#A86F57]/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#161616]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}}
                      disabled={isSubMaster}
                      className="border-border dark:border-[#A86F57]/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#161616]"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <SaleModal
        isOpen={showModal}
        onClose={handleCloseModal}
        companyId={companyId}
        sale={selectedSale}
      />
    </>
  );
};
