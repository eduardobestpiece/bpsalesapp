
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, User, Phone, Mail } from 'lucide-react';
import { useLeads, useSales } from '@/hooks/useCrmData';
import { LeadModal } from '@/components/CRM/LeadModal';
import { SaleModal } from '@/components/CRM/SaleModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock company ID - em produção, isso viria do contexto de autenticação
const MOCK_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const CrmDashboard = () => {
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leads = [], isLoading: leadsLoading } = useLeads(MOCK_COMPANY_ID);
  const { data: sales = [], isLoading: salesLoading } = useSales(MOCK_COMPANY_ID);

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = sales.filter(sale => 
    sale.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.responsible?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.responsible?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                      <Button onClick={() => setLeadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Lead
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros de pesquisa */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <Input 
                            placeholder="Pesquisar por nome, email, telefone..." 
                            className="w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline">
                          <Search className="h-4 w-4 mr-2" />
                          Pesquisar
                        </Button>
                      </div>

                      {/* Lista de Leads */}
                      {leadsLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Carregando leads...</p>
                        </div>
                      ) : filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p className="text-lg">Nenhum lead encontrado</p>
                          <p className="text-sm">
                            {leads.length === 0 ? 'Comece adicionando seu primeiro lead' : 'Tente ajustar os filtros de pesquisa'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredLeads.map((lead) => (
                            <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <h3 className="font-semibold">{lead.name}</h3>
                                    <Badge variant="outline">{lead.current_stage?.name}</Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    {lead.email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {lead.email}
                                      </div>
                                    )}
                                    {lead.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {lead.phone}
                                      </div>
                                    )}
                                    <p>Responsável: {lead.responsible?.first_name} {lead.responsible?.last_name}</p>
                                    <p>Funil: {lead.funnel?.name}</p>
                                    {lead.source && <p>Origem: {lead.source.name}</p>}
                                    <p>Criado: {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="vendas">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Gerenciar Vendas</CardTitle>
                      <Button onClick={() => setSaleModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Venda
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros de pesquisa */}
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <Input 
                            placeholder="Pesquisar por nome do lead, responsável ou valor..." 
                            className="w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline">
                          <Search className="h-4 w-4 mr-2" />
                          Pesquisar
                        </Button>
                      </div>

                      {/* Lista de Vendas */}
                      {salesLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Carregando vendas...</p>
                        </div>
                      ) : filteredSales.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p className="text-lg">Nenhuma venda encontrada</p>
                          <p className="text-sm">
                            {sales.length === 0 ? 'Comece registrando sua primeira venda' : 'Tente ajustar os filtros de pesquisa'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredSales.map((sale) => (
                            <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h3 className="font-semibold">Lead: {sale.lead?.name}</h3>
                                    <Badge variant="secondary">
                                      R$ {sale.sale_value?.toLocaleString('pt-BR')}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p>Responsável: {sale.responsible?.first_name} {sale.responsible?.last_name}</p>
                                    <p>Data: {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                                    {sale.team && <p>Time: {sale.team.name}</p>}
                                    <p>Registrado: {format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <LeadModal 
        isOpen={leadModalOpen} 
        onClose={() => setLeadModalOpen(false)}
        companyId={MOCK_COMPANY_ID}
      />
      <SaleModal 
        isOpen={saleModalOpen} 
        onClose={() => setSaleModalOpen(false)}
        companyId={MOCK_COMPANY_ID}
      />
    </div>
  );
};

export default CrmDashboard;
