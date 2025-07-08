
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive } from 'lucide-react';
import { SaleModal } from './SaleModal';

interface SalesListProps {
  companyId: string;
}

export const SalesList = ({ companyId }: SalesListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data para demonstração
  const sales = [
    {
      id: '1',
      saleDate: '2024-01-15',
      leadName: 'João Silva',
      saleValue: 15000,
      responsible: 'Maria Santos',
      team: 'Equipe Vendas',
      status: 'active'
    },
    {
      id: '2',
      saleDate: '2024-01-20',
      leadName: 'Ana Costa',
      saleValue: 25000,
      responsible: 'Pedro Oliveira',
      team: 'Equipe Digital',
      status: 'active'
    }
  ];

  const handleEdit = (sale: any) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const filteredSales = sales.filter(sale =>
    sale.saleDate.includes(searchTerm) ||
    sale.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.saleValue.toString().includes(searchTerm)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vendas</CardTitle>
              <CardDescription>
                Gerencie as vendas realizadas
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
                placeholder="Pesquisar por data, lead, responsável ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhuma venda encontrada para a pesquisa.' : 'Nenhuma venda registrada. Registre a primeira venda para começar.'}
              </p>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{formatDate(sale.saleDate)}</p>
                      <p className="text-sm text-muted-foreground">Data da Venda</p>
                    </div>
                    <div>
                      <p className="text-sm">{sale.leadName}</p>
                      <p className="text-sm text-muted-foreground">Lead</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(sale.saleValue)}</p>
                      <p className="text-sm text-muted-foreground">Valor</p>
                    </div>
                    <div>
                      <p className="text-sm">{sale.responsible}</p>
                      <p className="text-sm text-muted-foreground">Responsável</p>
                    </div>
                    <div>
                      <Badge variant="outline">{sale.team}</Badge>
                      <p className="text-sm text-muted-foreground">Equipe</p>
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
