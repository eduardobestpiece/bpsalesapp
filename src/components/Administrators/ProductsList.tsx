
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  // Modal de cópia
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [originCompanyId, setOriginCompanyId] = useState<string>('');
  const [copyLoading, setCopyLoading] = useState(false);

  // Adicionar estados para modal de duplicação:
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<Product | null>(null);

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
      console.error('Erro ao buscar administradoras:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`
          *,
          administrators:administrator_id (
            name
          )
        `)
        .order('name');

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

      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error, 'selectedAdministrator:', selectedAdministrator);
    } finally {
      setLoading(false);
    }
  };

  // Buscar empresas para seleção
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: canCopy,
  });

  // Função de cópia de produtos
  const handleCopyProducts = async () => {
    if (!originCompanyId || !selectedCompanyId) {
      toast.error('Selecione a empresa de origem e destino.');
      return;
    }
    setCopyLoading(true);
    try {
      // Buscar produtos da empresa de origem
      const { data: productsToCopy, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', originCompanyId)
        .eq('is_archived', false);
      if (error) throw error;
      if (!productsToCopy || productsToCopy.length === 0) {
        toast.error('Nenhum produto encontrado na empresa de origem.');
        setCopyLoading(false);
        return;
      }
      // Remover campos que não devem ser copiados
      const productsInsert = productsToCopy.map((product: any) => {
        const { id, created_at, updated_at, ...rest } = product;
        return { ...rest, company_id: selectedCompanyId };
      });
      // Inserir na empresa de destino
      const { error: insertError } = await supabase
        .from('products')
        .insert(productsInsert);
      if (insertError) throw insertError;
      toast.success('Produtos copiados com sucesso!');
      setCopyModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Erro ao copiar produtos:', err);
      toast.error('Erro ao copiar produtos: ' + (err.message || ''));
    } finally {
      setCopyLoading(false);
    }
  };

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
  }, [statusFilter, selectedAdministrator]);

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
      console.error('Erro ao arquivar produto:', error);
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(product)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(product)}
                          disabled={product.is_archived}
                        >
                          Duplicar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Botão de cópia de produtos */}
          {canCopy && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setCopyModalOpen(true)}>
                Copiar produtos de outra empresa
              </Button>
            </div>
          )}
        </>
      )}
      
      {/* Modal de cópia */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar produtos de outra empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Empresa de origem</label>
              <Select value={originCompanyId} onValueChange={setOriginCompanyId} disabled={companiesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={companiesLoading ? 'Carregando...' : 'Selecione a empresa'} />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    .filter((c: any) => c.id !== selectedCompanyId)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCopyProducts} disabled={!originCompanyId || copyLoading}>
              {copyLoading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {showDuplicateModal && (
        <ProductModal
          open={showDuplicateModal}
          onOpenChange={setShowDuplicateModal}
          product={duplicateData}
          onSuccess={() => {
            setShowDuplicateModal(false);
            setDuplicateData(null);
            fetchProducts();
          }}
        />
      )}

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
