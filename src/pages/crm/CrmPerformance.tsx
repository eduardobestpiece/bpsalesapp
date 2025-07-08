
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { PerformanceChart } from '@/components/CRM/PerformanceChart';

const CrmPerformance = () => {
  const { userRole, hasPermission } = useCrmAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  // Mock data para demonstração
  const funnelData = [
    { name: 'Prospecção', value: 120, target: 150, percentage: 80 },
    { name: 'Qualificação', value: 85, target: 100, percentage: 85 },
    { name: 'Proposta', value: 45, target: 60, percentage: 75 },
    { name: 'Negociação', value: 25, target: 30, percentage: 83.3 },
    { name: 'Fechamento', value: 15, target: 20, percentage: 75 }
  ];

  const dailyData = [
    { name: 'Segunda', value: 25, target: 30, percentage: 83.3 },
    { name: 'Terça', value: 28, target: 30, percentage: 93.3 },
    { name: 'Quarta', value: 22, target: 30, percentage: 73.3 },
    { name: 'Quinta', value: 30, target: 30, percentage: 100 },
    { name: 'Sexta', value: 15, target: 30, percentage: 50 }
  ];

  const weeklyData = [
    { name: 'Semana 1', value: 120, target: 150, percentage: 80 },
    { name: 'Semana 2', value: 135, target: 150, percentage: 90 },
    { name: 'Semana 3', value: 160, target: 150, percentage: 106.7 },
    { name: 'Semana 4', value: 145, target: 150, percentage: 96.7 }
  ];

  const monthlyData = [
    { name: 'Janeiro', value: 450, target: 500, percentage: 90 },
    { name: 'Fevereiro', value: 520, target: 500, percentage: 104 },
    { name: 'Março', value: 480, target: 500, percentage: 96 },
    { name: 'Abril', value: 530, target: 500, percentage: 106 }
  ];

  const canViewAllTeams = hasPermission('admin');
  const canViewTeam = hasPermission('leader');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Performance</h2>
                <p className="text-muted-foreground">
                  Dashboard com análise de performance e funis
                </p>
              </div>

              {/* Filtros */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Filtros de Visualização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Período</label>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Diário</SelectItem>
                          <SelectItem value="week">Semanal</SelectItem>
                          <SelectItem value="month">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {canViewAllTeams && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Equipe</label>
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as equipes</SelectItem>
                            <SelectItem value="team1">Equipe Vendas</SelectItem>
                            <SelectItem value="team2">Equipe Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {(canViewAllTeams || canViewTeam) && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Usuário</label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os usuários</SelectItem>
                            <SelectItem value="user1">João Silva</SelectItem>
                            <SelectItem value="user2">Maria Santos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Performance */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">560</p>
                      <p className="text-sm text-muted-foreground">Total de Leads</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">42</p>
                      <p className="text-sm text-muted-foreground">Vendas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">7.5%</p>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">R$ 125.400</p>
                      <p className="text-sm text-muted-foreground">Faturamento</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos de Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceChart title="Funil de Vendas" data={funnelData} />
                
                {selectedPeriod === 'day' && (
                  <PerformanceChart title="Performance Diária" data={dailyData} />
                )}
                
                {selectedPeriod === 'week' && (
                  <PerformanceChart title="Performance Semanal" data={weeklyData} />
                )}
                
                {selectedPeriod === 'month' && (
                  <PerformanceChart title="Performance Mensal" data={monthlyData} />
                )}
              </div>

              {/* Alertas de Performance */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Alertas de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-red-800">Atenção: Prospecção abaixo da meta</p>
                        <p className="text-sm text-red-600">120/150 leads (80% da meta)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-green-800">Parabéns: Fechamento acima da meta</p>
                        <p className="text-sm text-green-600">15/20 vendas (75% da meta)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmPerformance;
