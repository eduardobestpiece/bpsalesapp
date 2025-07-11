
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Archive, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export const ProductsList: React.FC<ProductsListProps> = ({
  searchTerm,
  statusFilter,
  selectedAdministrator,
  onEdit,
  onCreate
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);

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
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Produtos ({filteredProducts.length})
          </CardTitle>
          <Button onClick={onCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor do Crédito</TableHead>
                  <TableHead>Opções de Prazo</TableHead>
                  <TableHead>Administradora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>{formatCurrency(product.credit_value)}</TableCell>
                      <TableCell>{formatTermOptions(product.term_options)}</TableCell>
                      <TableCell>
                        {product.administrators?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_archived ? "secondary" : "default"}>
                          {product.is_archived ? 'Arquivado' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(product)}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
