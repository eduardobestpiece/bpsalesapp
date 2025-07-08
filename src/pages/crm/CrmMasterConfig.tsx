
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Archive, Users, Shield } from 'lucide-react';

const CrmMasterConfig = () => {
  const [searchCompany, setSearchCompany] = useState('');

  // Mock data - em um cenário real seria carregado do banco
  const companies = [
    {
      id: '1',
      name: 'Empresa Exemplo LTDA',
      status: 'active',
      users_count: 15,
      created_at: '2024-01-15',
    },
    {
      id: '2',
      name: 'Consultoria ABC',
      status: 'active',
      users_count: 8,
      created_at: '2024-02-20',
    },
  ];

  const archivedItems = [
    { type: 'company', name: 'Empresa Arquivada LTDA', archived_at: '2024-03-01' },
    { type: 'user', name: 'João Silva', archived_at: '2024-03-05' },
    { type: 'team', name: 'Equipe Vendas', archived_at: '2024-03-10' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-bold">Configurações Master</h2>
                </div>
                <p className="text-muted-foreground">
                  Gerenciamento avançado do sistema
                </p>
              </div>

              <Tabs defaultValue="companies" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="companies" className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Empresas</span>
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="flex items-center space-x-2">
                    <Archive className="h-4 w-4" />
                    <span>Itens Arquivados</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="companies" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5" />
                          <span>Gestão de Empresas</span>
                        </CardTitle>
                        <Button>
                          <Building2 className="h-4 w-4 mr-2" />
                          Nova Empresa
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Input
                          placeholder="Pesquisar empresa..."
                          value={searchCompany}
                          onChange={(e) => setSearchCompany(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>

                      <div className="grid gap-4">
                        {companies.map((company) => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{company.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{company.users_count} usuários</span>
                                  </span>
                                  <span>Criada em {new Date(company.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Ativa
                              </Badge>
                              <Button variant="outline" size="sm">
                                Gerenciar
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive">
                                Arquivar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="archived" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Archive className="h-5 w-5" />
                        <span>Itens Arquivados</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {archivedItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-gray-200 rounded-lg">
                                <Archive className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800">{item.name}</h4>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Badge variant="outline" className="capitalize">
                                    {item.type === 'company' ? 'Empresa' : 
                                     item.type === 'user' ? 'Usuário' : 'Time'}
                                  </Badge>
                                  <span>Arquivado em {new Date(item.archived_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" className="text-green-600">
                                Restaurar
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive">
                                Excluir Permanentemente
                              </Button>
                            </div>
                          </div>
                        ))}

                        {archivedItems.length === 0 && (
                          <div className="text-center py-12">
                            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Nenhum item arquivado
                            </h3>
                            <p className="text-gray-500">
                              Itens arquivados aparecerão aqui para gerenciamento.
                            </p>
                          </div>
                        )}
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

export default CrmMasterConfig;
