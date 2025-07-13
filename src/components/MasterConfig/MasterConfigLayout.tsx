
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Settings, Users, CreditCard, Package, Layers, ArrowUpDown, Percent } from 'lucide-react';
import { CompanySelector } from './CompanySelector';
import { useMasterConfig } from '@/contexts/MasterConfigContext';
import { AdministratorsList } from '../Administrators/AdministratorsList';
import { AdministratorModal } from '../Administrators/AdministratorModal';
import { InstallmentReductionList } from '../Administrators/InstallmentReductionList';
import { InstallmentReductionModal } from '../Administrators/InstallmentReductionModal';
import { InstallmentTypesList } from '../Administrators/InstallmentTypesList';
import { InstallmentTypeModal } from '../Administrators/InstallmentTypeModal';
import { ProductsList } from '../Administrators/ProductsList';
import { ProductModal } from '../Administrators/ProductModal';
import { BidTypesList } from '../Administrators/BidTypesList';
import { BidTypeModal } from '../Administrators/BidTypeModal';
import { EntryTypesList } from '../Administrators/EntryTypesList';
import { EntryTypeModal } from '../Administrators/EntryTypeModal';
import { LeveragesList } from '../Administrators/LeveragesList';
import { LeverageModal } from '../Administrators/LeverageModal';

interface TabConfig {
  value: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const MasterConfigLayout: React.FC = () => {
  const { userRole, canAccessModule, selectedCompanyId } = useMasterConfig();
  const [activeTab, setActiveTab] = useState('administrators');

  // Modal states
  const [administratorModal, setAdministratorModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [installmentReductionModal, setInstallmentReductionModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [installmentTypeModal, setInstallmentTypeModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [productModal, setProductModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [bidTypeModal, setBidTypeModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [entryTypeModal, setEntryTypeModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [leverageModal, setLeverageModal] = useState<{ open: boolean; data?: any }>({ open: false });

  const allTabs: TabConfig[] = [
    {
      value: 'administrators',
      label: 'Administradoras',
      icon: <Building2 className="w-4 h-4" />,
      component: (
        <AdministratorsList
          onEdit={(data) => setAdministratorModal({ open: true, data })}
          onCopy={(data) => setAdministratorModal({ open: true, data: { ...data, id: undefined, name: `${data.name} (Cópia)` } })}
        />
      ),
    },
    {
      value: 'installment_reductions',
      label: 'Redução de Parcela',
      icon: <Percent className="w-4 h-4" />,
      component: (
        <InstallmentReductionList
          searchTerm=""
          selectedAdministrator=""
          statusFilter="all"
          onEdit={(data) => setInstallmentReductionModal({ open: true, data })}
          onCopy={(data) => setInstallmentReductionModal({ open: true, data: { ...data, id: undefined, name: `${data.name} (Cópia)` } })}
        />
      ),
    },
    {
      value: 'installment_types',
      label: 'Tipos de Parcela',
      icon: <Layers className="w-4 h-4" />,
      component: (
        <InstallmentTypesList
          searchTerm=""
          statusFilter="all"
          selectedAdministrator=""
          onEdit={(data) => setInstallmentTypeModal({ open: true, data })}
        />
      ),
    },
    {
      value: 'products',
      label: 'Produtos',
      icon: <Package className="w-4 h-4" />,
      component: (
        <ProductsList
          onEdit={(data) => setProductModal({ open: true, data })}
          onCopy={(data) => setProductModal({ open: true, data: { ...data, id: undefined, name: `${data.name} (Cópia)` } })}
        />
      ),
    },
    {
      value: 'bid_types',
      label: 'Tipos de Lance',
      icon: <ArrowUpDown className="w-4 h-4" />,
      component: (
        <BidTypesList
          onEdit={(data) => setBidTypeModal({ open: true, data })}
          onCopy={(data) => setBidTypeModal({ open: true, data: { ...data, id: undefined, name: `${data.name} (Cópia)` } })}
        />
      ),
    },
    {
      value: 'entry_types',
      label: 'Tipos de Entrada',
      icon: <CreditCard className="w-4 h-4" />,
      component: (
        <EntryTypesList
          onEdit={(data) => setEntryTypeModal({ open: true, data })}
          onCopy={(data) => setEntryTypeModal({ open: true, data: { ...data, id: undefined, name: `${data.name} (Cópia)` } })}
        />
      ),
    },
    {
      value: 'leverages',
      label: 'Alavancagens',
      icon: <Settings className="w-4 h-4" />,
      component: (
        <LeveragesList
          onEdit={(data) => setLeverageModal({ open: true, data })}
          onCopy={(data) => setLeverageModal({ open: true, data: { ...data, id: undefined, name: `${data.name} (Cópia)` } })}
        />
      ),
    },
  ];

  const availableTabs = allTabs.filter((tab) => canAccessModule(tab.value));

  if (!selectedCompanyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações Master</h1>
            <p className="text-gray-600 mt-2">Gerencie as configurações do sistema</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{userRole?.toUpperCase()}</Badge>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Selecione uma Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanySelector />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações Master</h1>
          <p className="text-gray-600 mt-2">Gerencie as configurações do sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <CompanySelector />
          <Badge variant="outline">{userRole?.toUpperCase()}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2">
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tab.component}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modals */}
      <AdministratorModal
        open={administratorModal.open}
        onOpenChange={(open) => setAdministratorModal({ open })}
        administrator={administratorModal.data}
        onSuccess={() => setAdministratorModal({ open: false })}
      />

      <InstallmentReductionModal
        open={installmentReductionModal.open}
        onClose={() => setInstallmentReductionModal({ open: false })}
        onSave={() => setInstallmentReductionModal({ open: false })}
        initialData={installmentReductionModal.data}
        userRole={userRole || 'master'}
        companyId={selectedCompanyId}
      />

      <InstallmentTypeModal
        open={installmentTypeModal.open}
        onOpenChange={(open) => setInstallmentTypeModal({ open })}
        installmentType={installmentTypeModal.data}
        onSuccess={() => setInstallmentTypeModal({ open: false })}
      />

      <ProductModal
        open={productModal.open}
        onOpenChange={(open) => setProductModal({ open })}
        product={productModal.data}
        onSuccess={() => setProductModal({ open: false })}
      />

      <BidTypeModal
        open={bidTypeModal.open}
        onOpenChange={(open) => setBidTypeModal({ open })}
        bidType={bidTypeModal.data}
        onSuccess={() => setBidTypeModal({ open: false })}
      />

      <EntryTypeModal
        open={entryTypeModal.open}
        onOpenChange={(open) => setEntryTypeModal({ open })}
        entryType={entryTypeModal.data}
        onSuccess={() => setEntryTypeModal({ open: false })}
      />

      <LeverageModal
        open={leverageModal.open}
        onOpenChange={(open) => setLeverageModal({ open })}
        leverage={leverageModal.data}
        onSuccess={() => setLeverageModal({ open: false })}
      />
    </div>
  );
};
