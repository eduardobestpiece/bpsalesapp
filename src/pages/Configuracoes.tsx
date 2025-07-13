
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';

import { SimulatorLayout } from '@/components/Layout/SimulatorLayout';
import { AdministratorModal } from '@/components/Administrators/AdministratorModal';
import { AdministratorsList } from '@/components/Administrators/AdministratorsList';
import { ProductModal } from '@/components/Administrators/ProductModal';
import { ProductsList } from '@/components/Administrators/ProductsList';
import { InstallmentTypeModal } from '@/components/Administrators/InstallmentTypeModal';
import { InstallmentTypesList } from '@/components/Administrators/InstallmentTypesList';
import { LeverageModal } from '@/components/Administrators/LeverageModal';
import { LeveragesList } from '@/components/Administrators/LeveragesList';

export default function Configuracoes() {
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);
  const [showAdministratorModal, setShowAdministratorModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedInstallmentType, setSelectedInstallmentType] = useState<any>(null);
  const [showInstallmentTypeModal, setShowInstallmentTypeModal] = useState(false);
  const [selectedLeverage, setSelectedLeverage] = useState<any>(null);
  const [showLeverageModal, setShowLeverageModal] = useState(false);

  // Search and filter states
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [installmentSearchTerm, setInstallmentSearchTerm] = useState('');
  const [installmentStatusFilter, setInstallmentStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [leverageSearchTerm, setLeverageSearchTerm] = useState('');
  const [leverageStatusFilter, setLeverageStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Administrator filter for related tables
  const [productAdminFilter, setProductAdminFilter] = useState<string>('');
  const [installmentAdminFilter, setInstallmentAdminFilter] = useState<string>('');

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

  const handleEditInstallmentType = (installmentType: any) => {
    setSelectedInstallmentType(installmentType);
    setShowInstallmentTypeModal(true);
  };

  const handleEditLeverage = (leverage: any) => {
    setSelectedLeverage(leverage);
    setShowLeverageModal(true);
  };

  const closeModals = () => {
    setShowAdministratorModal(false);
    setShowProductModal(false);
    setShowInstallmentTypeModal(false);
    setShowLeverageModal(false);
    setSelectedAdministrator(null);
    setSelectedProduct(null);
    setSelectedInstallmentType(null);
    setSelectedLeverage(null);
    handleRefresh();
  };

  return (
    <SimulatorLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
            <p className="text-gray-600">Gerencie administradoras, produtos e configurações do sistema</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-0">
              <Tabs defaultValue="administrators" className="w-full">
                <div className="border-b bg-gray-50/50 px-6 py-4">
                  <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto">
                    <TabsTrigger value="administrators">Administradoras</TabsTrigger>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                    <TabsTrigger value="installments">Parcelas</TabsTrigger>
                    <TabsTrigger value="leverages">Alavancas</TabsTrigger>
                  </TabsList>
                </div>

                {/* Administrators Tab */}
                <TabsContent value="administrators" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Administradoras</h2>
                        <p className="text-gray-600 mt-1">Gerencie as administradoras de consórcio</p>
                      </div>
                      <Button onClick={() => setShowAdministratorModal(true)} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Administradora
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar administradoras..."
                          value={adminSearchTerm}
                          onChange={(e) => setAdminSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={adminStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setAdminStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="active">Ativas</SelectItem>
                          <SelectItem value="archived">Arquivadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <AdministratorsList
                      key={refreshKey}
                      searchTerm={adminSearchTerm}
                      statusFilter={adminStatusFilter}
                      onEdit={handleEditAdministrator}
                    />
                  </div>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Produtos</h2>
                        <p className="text-gray-600 mt-1">Gerencie os produtos de consórcio</p>
                      </div>
                      <Button onClick={() => setShowProductModal(true)} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar produtos..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={productStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setProductStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="archived">Arquivados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <ProductsList
                      key={refreshKey}
                      searchTerm={productSearchTerm}
                      statusFilter={productStatusFilter}
                      selectedAdministrator={productAdminFilter || ''}
                      onEdit={handleEditProduct}
                      onCreate={handleCreateProduct}
                    />
                  </div>
                </TabsContent>

                {/* Installment Types Tab */}
                <TabsContent value="installments" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Tipos de Parcela</h2>
                        <p className="text-gray-600 mt-1">Gerencie os tipos de parcela</p>
                      </div>
                      <Button onClick={() => setShowInstallmentTypeModal(true)} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Tipo de Parcela
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar tipos de parcela..."
                          value={installmentSearchTerm}
                          onChange={(e) => setInstallmentSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={installmentStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setInstallmentStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="archived">Arquivados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <InstallmentTypesList
                      key={refreshKey}
                      searchTerm={installmentSearchTerm}
                      statusFilter={installmentStatusFilter}
                      selectedAdministrator={installmentAdminFilter || null}
                      onEdit={handleEditInstallmentType}
                    />
                  </div>
                </TabsContent>

                {/* Leverages Tab */}
                <TabsContent value="leverages" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Alavancas</h2>
                        <p className="text-gray-600 mt-1">Gerencie as alavancas imobiliárias e veiculares</p>
                      </div>
                      <Button onClick={() => setShowLeverageModal(true)} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Alavanca
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por nome ou tipo..."
                          value={leverageSearchTerm}
                          onChange={(e) => setLeverageSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={leverageStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setLeverageStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="active">Ativas</SelectItem>
                          <SelectItem value="archived">Arquivadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <LeveragesList
                      key={refreshKey}
                      searchTerm={leverageSearchTerm}
                      statusFilter={leverageStatusFilter}
                      onEdit={handleEditLeverage}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Modals */}
          <AdministratorModal
            open={showAdministratorModal}
            onOpenChange={setShowAdministratorModal}
            administrator={selectedAdministrator}
            onSuccess={closeModals}
          />

          <ProductModal
            open={showProductModal}
            onOpenChange={setShowProductModal}
            product={selectedProduct}
            onSuccess={closeModals}
          />

          <InstallmentTypeModal
            open={showInstallmentTypeModal}
            onOpenChange={setShowInstallmentTypeModal}
            installmentType={selectedInstallmentType}
            onSuccess={closeModals}
          />

          <LeverageModal
            isOpen={showLeverageModal}
            onClose={closeModals}
            leverage={selectedLeverage}
            onSave={closeModals}
          />
        </div>
      </div>
    </SimulatorLayout>
  );
}
