
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';

import { SimulatorLayout } from '@/components/Layout/SimulatorLayout';
import { CreateAdministratorModal, EditAdministratorModal } from '@/components/Administrators/AdministratorModal';
import { AdministratorsList } from '@/components/Administrators/AdministratorsList';
import { ProductModal } from '@/components/Administrators/ProductModal';
import { ProductsList } from '@/components/Administrators/ProductsList';
import { InstallmentTypeModal } from '@/components/Administrators/InstallmentTypeModal';
import { InstallmentTypesList } from '@/components/Administrators/InstallmentTypesList';
import { LeverageModal } from '@/components/Administrators/LeverageModal';
import { LeveragesList } from '@/components/Administrators/LeveragesList';
import { InstallmentReductionsList } from '@/components/Administrators/InstallmentReductionsList';
import { InstallmentReductionModal } from '@/components/Administrators/InstallmentReductionModal';
import { UsersList } from '@/components/CRM/Configuration/UsersList';

export default function Configuracoes() {
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);
  const [showCreateAdministratorModal, setShowCreateAdministratorModal] = useState(false);
  const [showEditAdministratorModal, setShowEditAdministratorModal] = useState(false);
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
  const [leverageStatusFilter, setLeverageStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Administrator filter for related tables
  const [productAdminFilter, setProductAdminFilter] = useState<string>('');
  const [installmentAdminFilter, setInstallmentAdminFilter] = useState<string>('');

  // Estados para Redução de Parcela
  const [reductionSearchTerm, setReductionSearchTerm] = useState('');
  const [reductionStatusFilter, setReductionStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [reductionAdminFilter, setReductionAdminFilter] = useState<string>('');
  const [selectedReduction, setSelectedReduction] = useState<any>(null);
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [isCopyReduction, setIsCopyReduction] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditAdministrator = (administrator: any) => {
    setSelectedAdministrator(administrator);
    setShowEditAdministratorModal(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleDuplicateProduct = (product: any) => {
    setSelectedProduct({ ...product, name: `${product.name} - Cópia` });
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

  const handleEditReduction = (reduction: any) => {
    setSelectedReduction(reduction);
    setIsCopyReduction(false);
    setShowReductionModal(true);
  };
  const handleCopyReduction = (reduction: any) => {
    setSelectedReduction(reduction);
    setIsCopyReduction(true);
    setShowReductionModal(true);
  };
  const handleCreateReduction = () => {
    setSelectedReduction(null);
    setIsCopyReduction(false);
    setShowReductionModal(true);
  };

  const closeModals = () => {
    setShowCreateAdministratorModal(false);
    setShowEditAdministratorModal(false);
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
                  <TabsList className="grid grid-cols-6 w-full max-w-5xl mx-auto">
                    <TabsTrigger value="administrators">Administradoras</TabsTrigger>
                    <TabsTrigger value="reductions">Redução de Parcela</TabsTrigger>
                    <TabsTrigger value="installments">Parcelas</TabsTrigger>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                    <TabsTrigger value="leverages">Alavancas</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
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
                      <Button onClick={() => setShowCreateAdministratorModal(true)} className="bg-gradient-primary hover:opacity-90">
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
                    <CreateAdministratorModal
                      open={showCreateAdministratorModal}
                      onOpenChange={setShowCreateAdministratorModal}
                      onSuccess={() => {
                        setShowCreateAdministratorModal(false);
                        handleRefresh();
                      }}
                    />
                    <EditAdministratorModal
                      open={showEditAdministratorModal}
                      onOpenChange={(open) => {
                        setShowEditAdministratorModal(open);
                        if (!open) setSelectedAdministrator(null);
                      }}
                      administrator={selectedAdministrator}
                      onSuccess={() => {
                        setShowEditAdministratorModal(false);
                        setSelectedAdministrator(null);
                        handleRefresh();
                      }}
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
                      <Button onClick={handleCreateProduct} className="bg-gradient-primary hover:opacity-90">
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
                      onDuplicate={handleDuplicateProduct}
                    />
                  </div>
                </TabsContent>

                {/* Installment Types Tab */}
                <TabsContent value="installments" className="p-6">
                  <InstallmentTypesList
                    key={refreshKey}
                    searchTerm={installmentSearchTerm}
                    statusFilter={installmentStatusFilter}
                    selectedAdministrator={installmentAdminFilter || null}
                    onEdit={handleEditInstallmentType}
                  />
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

                {/* Redução de Parcela Tab */}
                <TabsContent value="reductions" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Redução de Parcela</h2>
                        <p className="text-gray-600 mt-1">Gerencie as regras de redução de parcela</p>
                      </div>
                      <Button onClick={handleCreateReduction} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Redução
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar reduções..."
                          value={reductionSearchTerm}
                          onChange={(e) => setReductionSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={reductionStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setReductionStatusFilter(value)}>
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
                    <InstallmentReductionsList
                      key={refreshKey}
                      searchTerm={reductionSearchTerm}
                      statusFilter={reductionStatusFilter}
                      selectedAdministrator={reductionAdminFilter || ''}
                      onEdit={handleEditReduction}
                      onCopy={handleCopyReduction}
                    />
                    <InstallmentReductionModal
                      open={showReductionModal}
                      onOpenChange={setShowReductionModal}
                      reduction={selectedReduction}
                      onSuccess={() => {
                        setShowReductionModal(false);
                        setSelectedReduction(null);
                        setIsCopyReduction(false);
                        handleRefresh();
                      }}
                      isCopy={isCopyReduction}
                    />
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="p-6">
                  <div className="space-y-6">
                    <UsersList />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Modals */}
          <CreateAdministratorModal
            open={showCreateAdministratorModal}
            onOpenChange={setShowCreateAdministratorModal}
            onSuccess={() => {
              setShowCreateAdministratorModal(false);
              handleRefresh();
            }}
          />

          <EditAdministratorModal
            open={showEditAdministratorModal}
            onOpenChange={(open) => {
              setShowEditAdministratorModal(open);
              if (!open) setSelectedAdministrator(null);
            }}
            administrator={selectedAdministrator}
            onSuccess={() => {
              setShowEditAdministratorModal(false);
              setSelectedAdministrator(null);
              handleRefresh();
            }}
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
