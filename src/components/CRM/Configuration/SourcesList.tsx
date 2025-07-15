
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Search } from 'lucide-react';
import { useSources, useDeleteSource } from '@/hooks/useSources';
import { SourceModal } from './SourceModal';
import { toast } from 'sonner';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export const SourcesList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCrmAuth();
  const { data: sources = [], isLoading } = useSources();
  const deleteSourceMutation = useDeleteSource();

  const handleEdit = (source: any) => {
    setSelectedSource(source);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSource(null);
  };

  const handleArchive = async (sourceId: string) => {
    try {
      await deleteSourceMutation.mutateAsync(sourceId);
      toast.success('Origem arquivada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar origem');
    }
  };

  const filteredSources = sources.filter(source => 
    source.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando origens...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Origens de Leads</CardTitle>
              <CardDescription>
                Gerencie as origens de onde vêm os leads
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Origem
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSources.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma origem encontrada com este termo.' : 'Nenhuma origem encontrada. Crie a primeira origem para começar.'}
                </p>
              </div>
            ) : (
              filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{source.name}</h3>
                    <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                      {source.status === 'active' ? 'Ativo' : 'Arquivado'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(source)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {source.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(source.id)}
                      >
                        Arquivar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <SourceModal
        isOpen={showModal}
        onClose={handleCloseModal}
        source={selectedSource}
      />
    </>
  );
};
