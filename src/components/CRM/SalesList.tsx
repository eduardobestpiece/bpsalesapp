
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { SaleModal } from './SaleModal';

interface SalesListProps {
  companyId: string;
}

export const SalesList = ({ companyId }: SalesListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: sales = [], isLoading } = useSales();

  const handleEdit = (sale: any) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_date.includes(searchTerm) ||
    sale.sale_value.toString().includes(searchTerm)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

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
                Gerencie todas as vendas da empresa
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Pesquisar por data, nome do lead, responsável ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhuma venda encontrada para a pesquisa.' : 'Nenhuma venda encontrada. Registre a primeira venda para começar.'}
              </p>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{formatDate(sale.sale_date)}</p>
                      <p className="text-sm text-muted-foreground">Data da Venda</p>
                    </div>
                    <div>
                      <p className="text-sm">Nome do Lead</p>
                      <p className="text-sm text-muted-foreground">A definir</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-600">{formatCurrency(sale.sale_value)}</p>
                      <p className="text-sm text-muted-foreground">Valor da Venda</p>
                    </div>
                    <div>
                      <p className="text-sm">Responsável</p>
                      <p className="text-sm text-muted-foreground">A definir</p>
                    </div>
                    <div>
                      <Badge variant="outline">Equipe</Badge>
                      <p className="text-sm text-muted-foreground">A definir</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(sale)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}}
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
