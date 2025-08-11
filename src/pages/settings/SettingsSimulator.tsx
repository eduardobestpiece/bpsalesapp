
import { useEffect, useState } from 'react';
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
import { CopyLeveragesModal } from '@/components/Administrators/CopyLeveragesModal';
import { InstallmentReductionsList } from '@/components/Administrators/InstallmentReductionsList';
import { InstallmentReductionModal } from '@/components/Administrators/InstallmentReductionModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsSimulator() {
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);
  const [showCreateAdministratorModal, setShowCreateAdministratorModal] = useState(false);
  const [showEditAdministratorModal, setShowEditAdministratorModal] = useState(false);
  const [showCopyAdministratorsModal, setShowCopyAdministratorsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedInstallmentType, setSelectedInstallmentType] = useState<any>(null);
  const [showInstallmentTypeModal, setShowInstallmentTypeModal] = useState(false);
  const [selectedLeverage, setSelectedLeverage] = useState<any>(null);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [showCopyLeveragesModal, setShowCopyLeveragesModal] = useState(false);

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

  const { userRole, companyId } = useCrmAuth();
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

  // Permissões por aba (role_page_permissions)
  const { data: perms = {} } = useQuery({
    queryKey: ['role_page_permissions', companyId, userRole],
    enabled: !!companyId && !!userRole,
    queryFn: async () => {
      const { data } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', companyId as string)
        .eq('role', userRole as any);
      const map: Record<string, boolean> = {};
      data?.forEach((r: any) => { map[r.page] = r.allowed; });
      return map;
    }
  });

  const canAdmins = perms['simulator_config_administrators'] !== false;
  const canReductions = perms['simulator_config_reductions'] !== false;
  const canInstallments = perms['simulator_config_installments'] !== false;
  const canProducts = perms['simulator_config_products'] !== false;
  const canLeverages = perms['simulator_config_leverages'] !== false;

  // Controla a aba ativa: escolhe a primeira permitida
  const allowedOrder: { key: string; allowed: boolean }[] = [
    { key: 'administrators', allowed: canAdmins },
    { key: 'reductions', allowed: canReductions },
    { key: 'installments', allowed: canInstallments },
    { key: 'products', allowed: canProducts },
    { key: 'leverages', allowed: canLeverages },
  ];
  const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
  const [tabValue, setTabValue] = useState<string>(firstAllowed || 'administrators');
  useEffect(() => {
    const next = allowedOrder.find(i => i.allowed)?.key || 'administrators';
    if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
      setTabValue(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdmins, canReductions, canInstallments, canProducts, canLeverages]);

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
              <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
                <div className="border-b border-border bg-muted/50 px-6 py-4">
                  <TabsList className="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {canAdmins && <TabsTrigger value="administrators">Administradoras</TabsTrigger>}
                    {canReductions && <TabsTrigger value="reductions">Redução de Parcela</TabsTrigger>}
                    {canInstallments && <TabsTrigger value="installments">Parcelas</TabsTrigger>}
                    {canProducts && <TabsTrigger value="products">Produtos</TabsTrigger>}
                    {canLeverages && <TabsTrigger value="leverages">Alavancas</TabsTrigger>}
                  </TabsList>
                </div>

                {canAdmins && (
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
                            variant="brandOutlineSecondaryHover" 
                            size="icon"
                            onClick={() => setShowCopyAdministratorsModal(true)}
                            title="Copiar administradoras"
                            className="brand-radius"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button onClick={() => setShowCreateAdministratorModal(true)}
                          variant="brandPrimaryToSecondary"
                          className="brand-radius"
                        >
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
                          className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                        />
                      </div>
                      <Select value={adminStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setAdminStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48 select-trigger-secondary no-ring-focus brand-radius">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="dropdown-item-secondary">
                            Todas
                          </SelectItem>
                          <SelectItem value="active" className="dropdown-item-secondary">
                            Ativas
                          </SelectItem>
                          <SelectItem value="archived" className="dropdown-item-secondary">
                            Arquivadas
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <AdministratorsList
                      key={refreshKey}
                      searchTerm={adminSearchTerm}
                      statusFilter={adminStatusFilter}
                      onEdit={(administrator: any) => { setSelectedAdministrator(administrator); setShowEditAdministratorModal(true); }}
                    />
                    <CopyAdministratorsModal
                      open={showCopyAdministratorsModal}
                      onOpenChange={setShowCopyAdministratorsModal}
                    />
                  </div>
                </TabsContent>
                )}

                {canProducts && (
                <TabsContent value="products" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Produtos</h2>
                        <p className="text-muted-foreground mt-1">Gerencie os produtos de consórcio</p>
                      </div>
                      <Button onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
                        variant="brandPrimaryToSecondary"
                      >
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
                          className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                        />
                      </div>
                      <Select value={productStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setProductStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48 select-trigger-secondary no-ring-focus brand-radius">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="dropdown-item-secondary">Todos</SelectItem>
                          <SelectItem value="active" className="dropdown-item-secondary">Ativos</SelectItem>
                          <SelectItem value="archived" className="dropdown-item-secondary">Arquivados</SelectItem>
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
                )}

                {canInstallments && (
                <TabsContent value="installments" className="p-6">
                  <InstallmentTypesList
                    key={refreshKey}
                    searchTerm={installmentSearchTerm}
                    statusFilter={installmentStatusFilter}
                    selectedAdministrator={installmentAdminFilter || null}
                    onEdit={(installmentType: any) => { setSelectedInstallmentType(installmentType); setShowInstallmentTypeModal(true); }}
                  />
                </TabsContent>
                )}

                {canReductions && (
                <TabsContent value="reductions" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Redução de Parcela</h2>
                        <p className="text-muted-foreground mt-1">Gerencie as reduções de parcela</p>
                      </div>
                      <Button onClick={() => { setSelectedReduction(null); setShowReductionModal(true); setIsCopyReduction(false); }} variant="brandPrimaryToSecondary">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Redução
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Buscar reduções..."
                          value={reductionSearchTerm}
                          onChange={(e) => setReductionSearchTerm(e.target.value)}
                          className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                        />
                      </div>
                      <Select value={reductionStatusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setReductionStatusFilter(value)}>
                        <SelectTrigger className="w-full sm:w-48 select-trigger-secondary no-ring-focus brand-radius">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="dropdown-item-secondary">Todas</SelectItem>
                          <SelectItem value="active" className="dropdown-item-secondary">Ativas</SelectItem>
                          <SelectItem value="archived" className="dropdown-item-secondary">Arquivadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <InstallmentReductionsList
                      key={refreshKey}
                      searchTerm={reductionSearchTerm}
                      statusFilter={reductionStatusFilter}
                      selectedAdministrator={reductionAdminFilter || ''}
                      onEdit={(red: any) => { setSelectedReduction(red); setShowReductionModal(true); setIsCopyReduction(false); }}
                    />
                    <InstallmentReductionModal
                      reduction={selectedReduction}
                      open={showReductionModal && !isCopyReduction}
                      onOpenChange={setShowReductionModal}
                      onClose={closeModals}
                    />
                  </div>
                </TabsContent>
                )}

                {canLeverages && (
                <TabsContent value="leverages" className="p-6">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Alavancas</h2>
                        <p className="text-muted-foreground mt-1">Gerencie as alavancas</p>
                      </div>
                      <Button onClick={() => { setSelectedLeverage(null); setShowLeverageModal(true); }} variant="brandPrimaryToSecondary">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Alavanca
                      </Button>
                    </div>

                    <LeveragesList
                      key={refreshKey}
                      searchTerm={leverageSearchTerm}
                      statusFilter={leverageStatusFilter}
                      onEdit={(lev: any) => { setSelectedLeverage(lev); setShowLeverageModal(true); }}
                    />

                    <CopyLeveragesModal
                      open={showCopyLeveragesModal}
                      onOpenChange={setShowCopyLeveragesModal}
                    />
                  </div>
                </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>

          <CreateAdministratorModal
            open={showCreateAdministratorModal}
            onOpenChange={setShowCreateAdministratorModal}
            onClose={closeModals}
          />
          <EditAdministratorModal
            administrator={selectedAdministrator}
            open={showEditAdministratorModal}
            onOpenChange={setShowEditAdministratorModal}
            onClose={closeModals}
          />
          <ProductModal
            product={selectedProduct}
            open={showProductModal}
            onOpenChange={setShowProductModal}
            onClose={closeModals}
          />
          <InstallmentTypeModal
            installmentType={selectedInstallmentType}
            open={showInstallmentTypeModal}
            onOpenChange={setShowInstallmentTypeModal}
            onClose={closeModals}
          />
          <LeverageModal
            leverage={selectedLeverage}
            open={showLeverageModal}
            onOpenChange={setShowLeverageModal}
            onClose={closeModals}
          />
          <CopyReductionsModal
            open={showReductionModal && isCopyReduction}
            onOpenChange={setShowReductionModal}
          />
          <InstallmentReductionModal
            reduction={selectedReduction}
            open={showReductionModal && !isCopyReduction}
            onOpenChange={setShowReductionModal}
            onClose={closeModals}
          />
        </div>
      </div>
    </SettingsLayout>
  );
} 