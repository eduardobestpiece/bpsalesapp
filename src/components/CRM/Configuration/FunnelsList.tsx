import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Archive, Eye } from 'lucide-react';
import { useFunnels } from '@/hooks/useCrmData';
import { FunnelModal } from './FunnelModal';

interface FunnelsListProps {
  companyId: string;
}

export const FunnelsList = ({ companyId }: FunnelsListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const { data: funnels = [], isLoading } = useFunnels();

  const handleEdit = (funnel: any) => {
    setSelectedFunnel(funnel);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFunnel(null);
  };

  const getVerificationTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal'
    };
    return labels[type as keyof typeof labels] || type;
  };

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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnels.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum funil encontrado. Crie o primeiro funil para começar.
              </p>
            ) : (
              funnels.map((funnel) => (
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
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(funnel)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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
        companyId={companyId}
        funnel={selectedFunnel}
      />
    </>
  );
};
