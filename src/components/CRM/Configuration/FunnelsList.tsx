
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Archive, Eye, Search } from 'lucide-react';
import { useFunnels } from '@/hooks/useCrmData';
import { useDeleteFunnel } from '@/hooks/useFunnels';
import { toast } from 'sonner';
import { FunnelModal } from './FunnelModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const FunnelsList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCrmAuth();
  const { data: funnels = [], isLoading } = useFunnels(companyId);
  const deleteFunnelMutation = useDeleteFunnel();

  const handleEdit = (funnel: any) => {
    setSelectedFunnel(funnel);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFunnel(null);
  };

  const handleArchive = async (funnelId: string) => {
    try {
      await deleteFunnelMutation.mutateAsync(funnelId);
      toast.success('Funil arquivado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar funil');
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredFunnels = funnels.filter(funnel =>
    funnel.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando funis...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Funis de Vendas</CardTitle>
              <CardDescription>
                Gerencie os funis de vendas da empresa
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funil
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFunnels.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhum funil encontrado com este termo.' : 'Nenhum funil encontrado. Crie o primeiro funil para começar.'}
              </p>
            ) : (
              filteredFunnels.map((funnel) => (
                <div
                  key={funnel.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{funnel.name}</h3>
                      <Badge variant={funnel.status === 'active' ? 'default' : 'secondary'}>
                        {funnel.status === 'active' ? 'Ativo' : 'Arquivado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Verificação: {getVerificationTypeLabel(funnel.verification_type)}
                      {funnel.verification_day && ` - Dia ${funnel.verification_day}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {funnel.stages?.length || 0} etapas configuradas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(funnel)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {funnel.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(funnel.id)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <FunnelModal
        isOpen={showModal}
        onClose={handleCloseModal}
        funnel={selectedFunnel}
      />
    </>
  );
};
