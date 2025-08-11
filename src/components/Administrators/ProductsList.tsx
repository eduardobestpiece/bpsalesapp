
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ProductModal } from './ProductModal';

interface Product {
  id: string;
  name: string;
  type: string;
  credit_value: number;
  term_options: number[];
  administrator_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  administrators?: {
    name: string;
  };
  admin_tax_percent?: number;
  reserve_fund_percent?: number;
  insurance_percent?: number;
}

interface Administrator {
  id: string;
  name: string;
}

interface ProductsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (product: Product) => void;
  onCreate: () => void;
  onDuplicate: (product: Product) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit,
  onCreate,
  onDuplicate
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);

  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  // Removidos: cópia e duplicação de produtos

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (!selectedCompanyId) { setProducts([]); setLoading(false); return; }
      let query = supabase
        .from('products')
        .select(`
          *,
          administrators:administrator_id (
            name
          )
        `)
        .order('name')
        .eq('company_id', selectedCompanyId);

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      if (selectedAdministrator && selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }

      const { data, error } = await query;
      if (error) throw error;
      console.log('[ProductsList] fetchProducts', { count: data?.length || 0, selectedCompanyId, selectedAdministrator, statusFilter });
      setProducts((data || []).map(product => ({ ...product, term_options: [] })));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Removido: busca de empresas para cópia

  // Removido: função de cópia

  // Removido: duplicação

  // Função para abrir modal de duplicação
  const handleDuplicate = (product: Product) => {
    setDuplicateData({ ...product, administrator_id: '' }); // Limpa administradora
    setShowDuplicateModal(true);
  };

  // Função para buscar installment_types ao editar
  const handleEdit = async (product: Product) => {
    // Buscar installment_types associados
    const { data: rels, error } = await supabase
      .from('product_installment_types')
      .select('installment_type_id')
      .eq('product_id', product.id);
    let installment_types: string[] = [];
    if (!error && rels) {
      installment_types = rels.map((r: any) => r.installment_type_id);
    }
    setEditData({ ...product, installment_types });
    setEditModalOpen(true);
  };

  useEffect(() => {
    fetchAdministrators();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, selectedAdministrator, selectedCompanyId]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleArchive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: !product.is_archived })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTermOptions = (terms: number[]) => {
    return terms.sort((a, b) => a - b).join(', ') + ' meses';
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administradora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Valor da Parcela</TableHead>
                <TableHead>Taxa de Administração (%)</TableHead>
                <TableHead>Fundo de Reserva (%)</TableHead>
                <TableHead>Seguro (%)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.administrators?.name || 'N/A'}</TableCell>
                    <TableCell>{product.type}</TableCell>
                    <TableCell>{formatCurrency(product.credit_value)}</TableCell>
                    <TableCell>{product.credit_value && product.term_options && product.term_options.length > 0
                      ? formatCurrency(product.credit_value / Math.max(...product.term_options))
                      : '-'}</TableCell>
                    <TableCell>{product.admin_tax_percent ?? '-'}</TableCell>
                    <TableCell>{product.reserve_fund_percent ?? '-'}</TableCell>
                    <TableCell>{product.insurance_percent ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="brandOutlineSecondaryHover"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="brand-radius"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="brandOutlineSecondaryHover"
                          size="sm"
                          onClick={() => handleArchive(product)}
                          className="brand-radius"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Removido: botão de cópia de produtos */}
        </>
      )}
      
      {/* Removidos: modal de cópia e modal de duplicação */}

      {/* Modal de edição */}
      {editModalOpen && (
        <ProductModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          product={editData}
          onSuccess={() => {
            setEditModalOpen(false);
            setEditData(null);
            fetchProducts();
          }}
        />
      )}
    </>
  );
};
