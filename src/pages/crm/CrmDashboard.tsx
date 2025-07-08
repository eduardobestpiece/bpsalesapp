
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive } from 'lucide-react';

const CrmDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              {/* Header */}
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">CRM - Gestão de Leads e Vendas</h2>
                <p className="text-muted-foreground">
                  Gerencie seus leads e vendas de forma eficiente
                </p>
              </div>

              {/* Tabs para Leads e Vendas */}
              <Tabs defaultValue="leads" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                  <TabsTrigger value="vendas">Vendas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="leads">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Gerenciar Leads</CardTitle>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Lead
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros de pesquisa */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <Input 
                            placeholder="Pesquisar por nome, email, telefone, responsável ou fase..." 
                            className="w-full"
                          />
                        </div>
                        <Button variant="outline">
                          <Search className="h-4 w-4 mr-2" />
                          Pesquisar
                        </Button>
                      </div>

                      {/* Lista de Leads */}
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg">Nenhum lead cadastrado ainda</p>
                        <p className="text-sm">Comece adicionando seu primeiro lead</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="vendas">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Gerenciar Vendas</CardTitle>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Venda
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros de pesquisa */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <Input 
                            placeholder="Pesquisar por data, nome do lead, responsável ou valor..." 
                            className="w-full"
                          />
                        </div>
                        <Button variant="outline">
                          <Search className="h-4 w-4 mr-2" />
                          Pesquisar
                        </Button>
                      </div>

                      {/* Lista de Vendas */}
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg">Nenhuma venda cadastrada ainda</p>
                        <p className="text-sm">Comece registrando sua primeira venda</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmDashboard;
