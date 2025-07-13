
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Package, CreditCard, Percent, Timer } from 'lucide-react';

// Import components
import { AdministratorsList } from '@/components/Administrators/AdministratorsList';
import { AdministratorModal } from '@/components/Administrators/AdministratorModal';
import { ProductsList } from '@/components/Administrators/ProductsList';
import { ProductModal } from '@/components/Administrators/ProductModal';
import { BidTypesList } from '@/components/Administrators/BidTypesList';
import { BidTypeModal } from '@/components/Administrators/BidTypeModal';
import { EntryTypesList } from '@/components/Administrators/EntryTypesList';
import { EntryTypeModal } from '@/components/Administrators/EntryTypeModal';
import { InstallmentTypesList } from '@/components/Administrators/InstallmentTypesList';
import { InstallmentTypeModal } from '@/components/Administrators/InstallmentTypeModal';
import { LeveragesList } from '@/components/Administrators/LeveragesList';
import { LeverageModal } from '@/components/Administrators/LeverageModal';

const Administrators = () => {
  // Estados para administradoras
  const [administratorSearchTerm, setAdministratorSearchTerm] = useState('');
  const [administratorStatusFilter, setAdministratorStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [showAdministratorModal, setShowAdministratorModal] = useState(false);
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);

  // Estados para produtos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [productAdminFilter, setProductAdminFilter] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Estados para outros modals
  const [showBidTypeModal, setShowBidTypeModal] = useState(false);
  const [selectedBidType, setSelectedBidType] = useState<any>(null);
  const [showEntryTypeModal, setShowEntryTypeModal] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState<any>(null);
  const [showInstallmentTypeModal, setShowInstallmentTypeModal] = useState(false);
  const [selectedInstallmentType, setSelectedInstallmentType] = useState<any>(null);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [selectedLeverage, setSelectedLeverage] = useState<any>(null);

  // Estado para refresh
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditAdministrator = (administrator: any) => {
    setSelectedAdministrator(administrator);
    setShowAdministratorModal(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCloseAdministratorModal = () => {
    setShowAdministratorModal(false);
    setSelectedAdministrator(null);
    handleRefresh();
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    handleRefresh();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Administração do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie administradoras, produtos e configurações do sistema
          </p>
        </div>

        <Tabs defaultValue="administrators" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="administrators" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Administradoras
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="bid-types" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Tipos de Lance
            </TabsTrigger>
            <TabsTrigger value="entry-types" className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Tipos de Entrada
            </TabsTrigger>
            <TabsTrigger value="installment-types" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Tipos de Parcela
            </TabsTrigger>
            <TabsTrigger value="leverages" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Alavancagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="administrators" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admin-search">Buscar</Label>
                    <Input
                      id="admin-search"
                      placeholder="Nome da administradora..."
                      value={administratorSearchTerm}
                      onChange={(e) => setAdministratorSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-status">Status</Label>
                    <Select value={administratorStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setAdministratorStatusFilter(value)}>
                      <SelectTrigger id="admin-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="archived">Arquivados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de adicionar administradora */}
            <div className="flex justify-end">
              <button
                className="bg-primary text-white px-4 py-2 rounded hover:opacity-90"
                onClick={() => {
                  setShowAdministratorModal(false);
                  setTimeout(() => {
                    setSelectedAdministrator(null);
                    setShowAdministratorModal(true);
                  }, 50);
                }}
              >
                Adicionar administradora
              </button>
            </div>

            <AdministratorsList
              key={refreshKey}
              searchTerm={administratorSearchTerm}
              statusFilter={administratorStatusFilter}
              onEdit={handleEditAdministrator}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="product-search">Buscar</Label>
                    <Input
                      id="product-search"
                      placeholder="Nome do produto..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-status">Status</Label>
                    <Select value={productStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setProductStatusFilter(value)}>
                      <SelectTrigger id="product-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="archived">Arquivados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-admin">Administradora</Label>
                    <Select value={productAdminFilter} onValueChange={setProductAdminFilter}>
                      <SelectTrigger id="product-admin">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ProductsList
              key={refreshKey}
              searchTerm={productSearchTerm}
              statusFilter={productStatusFilter}
              selectedAdministrator={productAdminFilter || ''}
              onEdit={handleEditProduct}
              onCreate={handleCreateProduct}
            />
          </TabsContent>

          <TabsContent value="bid-types">
            <BidTypesList key={refreshKey} onEdit={setSelectedBidType} />
          </TabsContent>

          <TabsContent value="entry-types">
            <EntryTypesList key={refreshKey} onEdit={setSelectedEntryType} />
          </TabsContent>

          <TabsContent value="installment-types">
            <InstallmentTypesList key={refreshKey} onEdit={setSelectedInstallmentType} />
          </TabsContent>

          <TabsContent value="leverages">
            <LeveragesList key={refreshKey} onEdit={setSelectedLeverage} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AdministratorModal
          key={selectedAdministrator?.id || 'new'}
          open={showAdministratorModal}
          onOpenChange={(open) => {
            setShowAdministratorModal(open);
            if (!open) setSelectedAdministrator(null);
          }}
          administrator={selectedAdministrator}
          onSuccess={() => {
            setShowAdministratorModal(false);
            setSelectedAdministrator(null);
            handleRefresh();
          }}
        />

        <ProductModal
          isOpen={showProductModal}
          onClose={handleCloseProductModal}
          product={selectedProduct}
        />

        <BidTypeModal
          isOpen={showBidTypeModal}
          onClose={() => { setShowBidTypeModal(false); setSelectedBidType(null); handleRefresh(); }}
          bidType={selectedBidType}
        />

        <EntryTypeModal
          isOpen={showEntryTypeModal}
          onClose={() => { setShowEntryTypeModal(false); setSelectedEntryType(null); handleRefresh(); }}
          entryType={selectedEntryType}
        />

        <InstallmentTypeModal
          isOpen={showInstallmentTypeModal}
          onClose={() => { setShowInstallmentTypeModal(false); setSelectedInstallmentType(null); handleRefresh(); }}
          installmentType={selectedInstallmentType}
        />

        <LeverageModal
          isOpen={showLeverageModal}
          onClose={() => { setShowLeverageModal(false); setSelectedLeverage(null); handleRefresh(); }}
          leverage={selectedLeverage}
        />
      </div>
    </div>
  );
};

export default Administrators;
