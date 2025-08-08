
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Copy } from 'lucide-react';

import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { CreateAdministratorModal, EditAdministratorModal } from '@/components/Administrators/AdministratorModal';
import { AdministratorsList } from '@/components/Administrators/AdministratorsList';
import { CopyAdministratorsModal } from '@/components/Administrators/CopyAdministratorsModal';
import { CopyReductionsModal } from '@/components/Administrators/CopyReductionsModal';
import { ProductModal } from '@/components/Administrators/ProductModal';
import { ProductsList } from '@/components/Administrators/ProductsList';
import { InstallmentTypeModal } from '@/components/Administrators/InstallmentTypeModal';
import { InstallmentTypesList } from '@/components/Administrators/InstallmentTypesList';
import { LeverageModal } from '@/components/Administrators/LeverageModal';
import { LeveragesList } from '@/components/Administrators/LeveragesList';
import { InstallmentReductionsList } from '@/components/Administrators/InstallmentReductionsList';
import { InstallmentReductionModal } from '@/components/Administrators/InstallmentReductionModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export default function SettingsSimulator() {
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);
  const [showCreateAdministratorModal, setShowCreateAdministratorModal] = useState(false);
  const [showEditAdministratorModal, setShowEditAdministratorModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedInstallmentType, setSelectedInstallmentType] = useState<any>(null);
  const [showInstallmentTypeModal, setShowInstallmentTypeModal] = useState(false);
  const [selectedLeverage, setSelectedLeverage] = useState<any>(null);
  const [showLeverageModal, setShowLeverageModal] = useState(false);

  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [installmentSearchTerm, setInstallmentSearchTerm] = useState('');
  const [installmentStatusFilter, setInstallmentStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [leverageSearchTerm, setLeverageSearchTerm] = useState('');
  const [leverageStatusFilter, setLeverageStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [reductionSearchTerm, setReductionSearchTerm] = useState('');
  const [reductionStatusFilter, setReductionStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedReduction, setSelectedReduction] = useState<any>(null);
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [isCopyReduction, setIsCopyReduction] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [productAdminFilter, setProductAdminFilter] = useState<string>('');
  const [installmentAdminFilter, setInstallmentAdminFilter] = useState<string>('');
  const [reductionAdminFilter, setReductionAdminFilter] = useState<string>('');

  const { userRole } = useCrmAuth();
  const isMaster = userRole === 'master';

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

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
    <SettingsLayout>
      <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-primary-50/20 via-background to-muted/10 dark:from-[#131313] dark:via-[#1E1E1E] dark:to-[#161616] text-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Configurações do Simulador</h1>
            <p className="text-muted-foreground">Gerencie administradoras, produtos, parcelas, alavancas e reduções</p>
          </div>

          <Card className="shadow-xl border-0 bg-card">
            <CardContent className="p-0">
              <Tabs defaultValue="administrators" className="w-full">
                <div className="border-b border-border bg-muted/50 px-6 py-4">
                  <TabsList className="grid grid-cols-6 w-full max-w-5xl mx-auto">
                    <TabsTrigger value="administrators">Administradoras</TabsTrigger>
                    <TabsTrigger value="reductions">Redução de Parcela</TabsTrigger>
                    <TabsTrigger value="installments">Parcelas</TabsTrigger>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                    <TabsTrigger value="leverages">Alavancas</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="administrators" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Administradoras</h2>
                        <p className="text-muted-foreground mt-1">Gerencie as administradoras de consórcio</p>
                      </div>
                      <div className="flex gap-2">
                        {isMaster && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setShowCopyAdministratorsModal(true)}
                            title="Copiar administradoras"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button onClick={() => setShowCreateAdministratorModal(true)} className="bg-gradient-primary hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Administradora
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                      onEdit={(administrator: any) => { setSelectedAdministrator(administrator); setShowEditAdministratorModal(true); }}
                    />
                    <CreateAdministratorModal
                      open={showCreateAdministratorModal}
                      onOpenChange={setShowCreateAdministratorModal}
                      onSuccess={() => { setShowCreateAdministratorModal(false); handleRefresh(); }}
                    />
                    <EditAdministratorModal
                      open={showEditAdministratorModal}
                      onOpenChange={(open) => { setShowEditAdministratorModal(open); if (!open) setSelectedAdministrator(null); }}
                      administrator={selectedAdministrator}
                      onSuccess={() => { setShowEditAdministratorModal(false); setSelectedAdministrator(null); handleRefresh(); }}
                    />
                    <CopyAdministratorsModal
                      open={false}
                      onOpenChange={() => {}}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="products" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Produtos</h2>
                        <p className="text-muted-foreground mt-1">Gerencie os produtos de consórcio</p>
                      </div>
                      <Button onClick={() => { setSelectedProduct(null); setShowProductModal(true); }} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                      onEdit={(product: any) => { setSelectedProduct(product); setShowProductModal(true); }}
                      onCreate={() => { setSelectedProduct(null); setShowProductModal(true); }}
                      onDuplicate={(product: any) => { setSelectedProduct({ ...product, name: `${product.name} - Cópia` }); setShowProductModal(true); }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="installments" className="p-6">
                  <InstallmentTypesList
                    key={refreshKey}
                    searchTerm={installmentSearchTerm}
                    statusFilter={installmentStatusFilter}
                    selectedAdministrator={installmentAdminFilter || null}
                    onEdit={(installmentType: any) => { setSelectedInstallmentType(installmentType); setShowInstallmentTypeModal(true); }}
                  />
                </TabsContent>

                <TabsContent value="leverages" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Alavancas</h2>
                        <p className="text-muted-foreground mt-1">Gerencie as alavancas imobiliárias e veiculares</p>
                      </div>
                      <Button onClick={() => setShowLeverageModal(true)} className="bg-gradient-primary hover:opacity-90">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Alavanca
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                      onEdit={(lev: any) => { setSelectedLeverage(lev); setShowLeverageModal(true); }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="reductions" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Redução de Parcela</h2>
                        <p className="text-muted-foreground mt-1">Gerencie as regras de redução de parcela</p>
                      </div>
                      <div className="flex gap-2">
                        {isMaster && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setShowReductionModal(true)}
                            title="Copiar reduções de parcela"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button onClick={() => { setSelectedReduction(null); setIsCopyReduction(false); setShowReductionModal(true); }} className="bg-gradient-primary hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Redução
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                      onEdit={(red: any) => { setSelectedReduction(red); setIsCopyReduction(false); setShowReductionModal(true); }}
                    />
                    <InstallmentReductionModal
                      open={showReductionModal}
                      onOpenChange={setShowReductionModal}
                      reduction={selectedReduction}
                      onSuccess={() => { setShowReductionModal(false); setSelectedReduction(null); setIsCopyReduction(false); handleRefresh(); }}
                      isCopy={isCopyReduction}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <CreateAdministratorModal
            open={showCreateAdministratorModal}
            onOpenChange={setShowCreateAdministratorModal}
            onSuccess={() => { setShowCreateAdministratorModal(false); handleRefresh(); }}
          />

          <EditAdministratorModal
            open={showEditAdministratorModal}
            onOpenChange={(open) => { setShowEditAdministratorModal(open); if (!open) setSelectedAdministrator(null); }}
            administrator={selectedAdministrator}
            onSuccess={() => { setShowEditAdministratorModal(false); setSelectedAdministrator(null); handleRefresh(); }}
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

          <CopyAdministratorsModal
            open={false}
            onOpenChange={() => {}}
          />
        </div>
      </div>
    </SettingsLayout>
  );
} 