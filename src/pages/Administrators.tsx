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
import { BidTypeModal } from '@/components/Administrators/BidTypeModal';
import { BidTypesList } from '@/components/Administrators/BidTypesList';
import { EntryTypeModal } from '@/components/Administrators/EntryTypeModal';
import { EntryTypesList } from '@/components/Administrators/EntryTypesList';
import { LeverageModal } from '@/components/Administrators/LeverageModal';
import { LeveragesList } from '@/components/Administrators/LeveragesList';

export default function Administrators() {
  const [selectedAdministrator, setSelectedAdministrator] = useState<any>(null);
  const [showAdministratorModal, setShowAdministratorModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedInstallmentType, setSelectedInstallmentType] = useState<any>(null);
  const [showInstallmentTypeModal, setShowInstallmentTypeModal] = useState(false);
  const [selectedBidType, setSelectedBidType] = useState<any>(null);
  const [showBidTypeModal, setShowBidTypeModal] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState<any>(null);
  const [showEntryTypeModal, setShowEntryTypeModal] = useState(false);
  const [selectedLeverage, setSelectedLeverage] = useState<any>(null);
  const [showLeverageModal, setShowLeverageModal] = useState(false);

  // Search and filter states
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [installmentSearchTerm, setInstallmentSearchTerm] = useState('');
  const [installmentStatusFilter, setInstallmentStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [bidSearchTerm, setBidSearchTerm] = useState('');
  const [bidStatusFilter, setBidStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [entryStatusFilter, setEntryStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [leverageSearchTerm, setLeverageSearchTerm] = useState('');
  const [leverageStatusFilter, setLeverageStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Administrator filter for related tables
  const [productAdminFilter, setProductAdminFilter] = useState<string>('');
  const [installmentAdminFilter, setInstallmentAdminFilter] = useState<string>('');
  const [bidAdminFilter, setBidAdminFilter] = useState<string>('');
  const [entryAdminFilter, setEntryAdminFilter] = useState<string>('');

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <SimulatorLayout>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="administrators" className="w-full">
          <div className="border-b bg-gray-50/50 px-6 py-4">
            <TabsList className="grid grid-cols-7 w-full max-w-5xl mx-auto">
              <TabsTrigger value="administrators">Administradoras</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="installments">Parcelas</TabsTrigger>
              <TabsTrigger value="bid-types">Tipos de Lance</TabsTrigger>
              <TabsTrigger value="entry-types">Entradas</TabsTrigger>
              <TabsTrigger value="installment-types">Tipos de Parcela</TabsTrigger>
              <TabsTrigger value="leverages">Alavancas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="administrators" className="p-6">
            <AdministratorsList
              searchTerm=""
              statusFilter="all"
              onEdit={() => {}}
            />
          </TabsContent>

          <TabsContent value="products" className="p-6">
            <ProductsList
              searchTerm=""
              statusFilter="all"
              selectedAdministrator=""
              onEdit={() => {}}
              onCreate={() => {}}
            />
          </TabsContent>

          <TabsContent value="installments" className="p-6">
            <div>Installments Content</div>
          </TabsContent>
        
          <TabsContent value="bid-types" className="p-6">
            <BidTypesList
              searchTerm=""
              statusFilter="all"
              selectedAdministrator=""
              onEdit={() => {}}
            />
          </TabsContent>

          <TabsContent value="entry-types" className="p-6">
            <EntryTypesList
              searchTerm=""
              statusFilter="all"
              selectedAdministrator=""
              onEdit={() => {}}
            />
          </TabsContent>

          <TabsContent value="installment-types" className="p-6">
            <InstallmentTypesList
              searchTerm=""
              statusFilter="all"
              selectedAdministrator=""
              onEdit={() => {}}
            />
          </TabsContent>

          <TabsContent value="leverages" className="p-6">
            <LeveragesList
              searchTerm=""
              statusFilter="all"
              onEdit={() => {}}
            />
          </TabsContent>

          <AdministratorModal
            open={showAdministratorModal}
            onOpenChange={setShowAdministratorModal}
            administrator={selectedAdministrator}
            onSuccess={handleRefresh}
          />

          <ProductModal
            open={showProductModal}
            onOpenChange={setShowProductModal}
            product={selectedProduct}
            onSuccess={handleRefresh}
          />

          <BidTypeModal
            open={showBidTypeModal}
            onOpenChange={setShowBidTypeModal}
            bidType={selectedBidType}
            onSuccess={handleRefresh}
          />

          <EntryTypeModal
            open={showEntryTypeModal}
            onOpenChange={setShowEntryTypeModal}
            entryType={selectedEntryType}
            onSuccess={handleRefresh}
          />

          <InstallmentTypeModal
            open={showInstallmentTypeModal}
            onOpenChange={setShowInstallmentTypeModal}
            installmentType={selectedInstallmentType}
            onSuccess={handleRefresh}
          />

          <LeverageModal
            isOpen={showLeverageModal}
            onClose={handleRefresh}
            leverage={selectedLeverage}
            onSave={handleRefresh}
          />
      </div>
    </SimulatorLayout>
  );
}
