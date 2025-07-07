
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, Trash2 } from 'lucide-react';
import { AdministratorModal } from '@/components/Administrators/AdministratorModal';
import { BidTypeModal } from '@/components/Administrators/BidTypeModal';
import { ProductModal } from '@/components/Administrators/ProductModal';
import { AdministratorsList } from '@/components/Administrators/AdministratorsList';
import { BidTypesList } from '@/components/Administrators/BidTypesList';
import { ProductsList } from '@/components/Administrators/ProductsList';

export const Administrators = () => {
  const [activeTab, setActiveTab] = useState<'administrators' | 'bid-types' | 'products'>('administrators');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedAdministrator, setSelectedAdministrator] = useState<string>('all');
  
  // Modal states
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [bidTypeModalOpen, setBidTypeModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  
  // Edit states
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editingBidType, setBidTypeAdmin] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

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
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Administradoras</h1>
        <Button 
          onClick={() => {
            if (activeTab === 'administrators') handleOpenAdminModal();
            else if (activeTab === 'bid-types') handleOpenBidTypeModal();
            else if (activeTab === 'products') handleOpenProductModal();
          }}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar {activeTab === 'administrators' ? 'Administradora' : activeTab === 'bid-types' ? 'Tipo de Lance' : 'Produto'}
        </Button>
      </div>

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'administrators', label: 'Administradoras' },
            { key: 'bid-types', label: 'Tipos de Lance' },
            { key: 'products', label: 'Produtos' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.key as any)}
              className={activeTab === tab.key ? 'bg-amber-600 hover:bg-amber-700' : ''}
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
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="archived">Arquivados</SelectItem>
            </SelectContent>
          </Select>

          {(activeTab === 'bid-types' || activeTab === 'products') && (
            <Select value={selectedAdministrator} onValueChange={setSelectedAdministrator}>
              <SelectTrigger className="w-48">
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
    </div>
  );
};
