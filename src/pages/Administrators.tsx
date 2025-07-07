
import React, { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { AdministratorModal } from '@/components/Administrators/AdministratorModal';
import { BidTypeModal } from '@/components/Administrators/BidTypeModal';
import { ProductModal } from '@/components/Administrators/ProductModal';
import { InstallmentTypeModal } from '@/components/Administrators/InstallmentTypeModal';
import { EntryTypeModal } from '@/components/Administrators/EntryTypeModal';
import { AdministratorsList } from '@/components/Administrators/AdministratorsList';
import { BidTypesList } from '@/components/Administrators/BidTypesList';
import { ProductsList } from '@/components/Administrators/ProductsList';
import { InstallmentTypesList } from '@/components/Administrators/InstallmentTypesList';
import { EntryTypesList } from '@/components/Administrators/EntryTypesList';

export const Administrators = () => {
  const [activeTab, setActiveTab] = useState<'administrators' | 'bid-types' | 'products' | 'installment-types' | 'entry-types'>('administrators');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedAdministrator, setSelectedAdministrator] = useState<string>('all');
  
  // Modal states
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [bidTypeModalOpen, setBidTypeModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [installmentTypeModalOpen, setInstallmentTypeModalOpen] = useState(false);
  const [entryTypeModalOpen, setEntryTypeModalOpen] = useState(false);
  
  // Edit states
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editingBidType, setBidTypeAdmin] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingInstallmentType, setEditingInstallmentType] = useState(null);
  const [editingEntryType, setEditingEntryType] = useState(null);

  const handleOpenAdminModal = (admin = null) => {
    setEditingAdmin(admin);
    setAdminModalOpen(true);
  };

  const handleOpenBidTypeModal = (bidType = null) => {
    setBidTypeAdmin(bidType);
    setBidTypeModalOpen(true);
  };

  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleOpenInstallmentTypeModal = (installmentType = null) => {
    setEditingInstallmentType(installmentType);
    setInstallmentTypeModalOpen(true);
  };

  const handleOpenEntryTypeModal = (entryType = null) => {
    setEditingEntryType(entryType);
    setEntryTypeModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'administrators':
        return (
          <AdministratorsList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onEdit={handleOpenAdminModal}
          />
        );
      case 'bid-types':
        return (
          <BidTypesList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            selectedAdministrator={selectedAdministrator}
            onEdit={handleOpenBidTypeModal}
          />
        );
      case 'products':
        return (
          <ProductsList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            selectedAdministrator={selectedAdministrator}
            onEdit={handleOpenProductModal}
          />
        );
      case 'installment-types':
        return (
          <InstallmentTypesList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            selectedAdministrator={selectedAdministrator}
            onEdit={handleOpenInstallmentTypeModal}
          />
        );
      case 'entry-types':
        return (
          <EntryTypesList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            selectedAdministrator={selectedAdministrator}
            onEdit={handleOpenEntryTypeModal}
          />
        );
      default:
        return null;
    }
  };

  const getButtonText = () => {
    switch (activeTab) {
      case 'administrators': return 'Administradora';
      case 'bid-types': return 'Tipo de Lance';
      case 'products': return 'Produto';
      case 'installment-types': return 'Tipo de Parcela';
      case 'entry-types': return 'Tipo de Entrada';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-secondary">Gerenciamento de Administradoras</h1>
          <Button 
            onClick={() => {
              if (activeTab === 'administrators') handleOpenAdminModal();
              else if (activeTab === 'bid-types') handleOpenBidTypeModal();
              else if (activeTab === 'products') handleOpenProductModal();
              else if (activeTab === 'installment-types') handleOpenInstallmentTypeModal();
              else if (activeTab === 'entry-types') handleOpenEntryTypeModal();
            }}
            className="bg-gradient-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar {getButtonText()}
          </Button>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
          <Card className="bg-white rounded-[calc(1.5rem-4px)] p-6 shadow-sm">
            <div className="flex space-x-1 mb-6 flex-wrap">
              {[
                { key: 'administrators', label: 'Administradoras' },
                { key: 'bid-types', label: 'Tipos de Lance' },
                { key: 'products', label: 'Produtos' },
                { key: 'installment-types', label: 'Parcelas' },
                { key: 'entry-types', label: 'Entradas' }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={activeTab === tab.key ? 'bg-gradient-primary hover:opacity-90 text-white' : 'hover:bg-primary-50 hover:border-primary-200'}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-48 focus:border-primary-400 focus:ring-primary-100">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>

              {(activeTab === 'bid-types' || activeTab === 'products' || activeTab === 'installment-types' || activeTab === 'entry-types') && (
                <Select value={selectedAdministrator} onValueChange={setSelectedAdministrator}>
                  <SelectTrigger className="w-48 focus:border-primary-400 focus:ring-primary-100">
                    <SelectValue placeholder="Administradora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {/* TODO: Load administrators from database */}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Content */}
            {renderTabContent()}
          </Card>
        </div>

        {/* Modals */}
        <AdministratorModal
          open={adminModalOpen}
          onOpenChange={setAdminModalOpen}
          administrator={editingAdmin}
          onSuccess={() => {
            setAdminModalOpen(false);
            setEditingAdmin(null);
          }}
        />

        <BidTypeModal
          open={bidTypeModalOpen}
          onOpenChange={setBidTypeModalOpen}
          bidType={editingBidType}
          onSuccess={() => {
            setBidTypeModalOpen(false);
            setBidTypeAdmin(null);
          }}
        />

        <ProductModal
          open={productModalOpen}
          onOpenChange={setProductModalOpen}
          product={editingProduct}
          onSuccess={() => {
            setProductModalOpen(false);
            setEditingProduct(null);
          }}
        />

        <InstallmentTypeModal
          open={installmentTypeModalOpen}
          onOpenChange={setInstallmentTypeModalOpen}
          installmentType={editingInstallmentType}
          onSuccess={() => {
            setInstallmentTypeModalOpen(false);
            setEditingInstallmentType(null);
          }}
        />

        <EntryTypeModal
          open={entryTypeModalOpen}
          onOpenChange={setEntryTypeModalOpen}
          entryType={editingEntryType}
          onSuccess={() => {
            setEntryTypeModalOpen(false);
            setEditingEntryType(null);
          }}
        />
      </div>
    </div>
  );
};
