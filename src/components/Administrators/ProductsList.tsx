
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCrmAuth } from '@/hooks/useCrmAuth';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  type: string;
  administrator_id: string;
  credit_value: number;
  term_options: number[];
  is_archived: boolean;
  administrators?: {
    name: string;
  };
}

interface ProductsListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  selectedAdministrator: string;
  onEdit: (product: Product) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          administrators (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('is_archived', statusFilter === 'archived');
      }

      if (selectedAdministrator && selectedAdministrator !== 'all') {
        query = query.eq('administrator_id', selectedAdministrator);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: !isArchived })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Produto ${isArchived ? 'restaurado' : 'arquivado'} com sucesso!`);
      fetchProducts();
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error('Erro ao arquivar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Produto excluído com sucesso!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, statusFilter, selectedAdministrator]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-xs"
          disabled={isSubMaster}
        />
        <Button onClick={onCreate} disabled={isSubMaster}>
          Novo Produto
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Administradora</TableHead>
            <TableHead>Valor do Crédito</TableHead>
            <TableHead>Prazos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <Badge variant={product.type === 'property' ? 'default' : 'secondary'}>
                  {product.type === 'property' ? 'Imóvel' : 'Veículo'}
                </Badge>
              </TableCell>
              <TableCell>{product.administrators?.name}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.credit_value)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.term_options.sort((a, b) => a - b).map((term) => (
                    <Badge key={term} variant="outline" className="text-xs">
                      {term}m
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={product.is_archived ? 'destructive' : 'default'}>
                  {product.is_archived ? 'Arquivado' : 'Ativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    disabled={isSubMaster}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(product.id, product.is_archived)}
                    disabled={isSubMaster}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={isSubMaster}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  );
};
