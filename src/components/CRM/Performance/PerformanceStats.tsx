
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react';

interface PerformanceStatsProps {
  totalLeads: number;
  totalSales: number;
  conversionRate: number;
  averageTicket: number;
  totalRevenue: number;
  previousPeriodComparison?: {
    leadsChange: number;
    salesChange: number;
    revenueChange: number;
  };
}

export const PerformanceStats = ({ 
  totalLeads, 
  totalSales, 
  conversionRate, 
  averageTicket, 
  totalRevenue,
  previousPeriodComparison 
}: PerformanceStatsProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          {previousPeriodComparison && (
            <div className={`text-xs flex items-center ${getChangeColor(previousPeriodComparison.leadsChange)}`}>
              {getChangeIcon(previousPeriodComparison.leadsChange)}
              <span className="ml-1">
                {formatPercentage(previousPeriodComparison.leadsChange)} vs período anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSales}</div>
          {previousPeriodComparison && (
            <div className={`text-xs flex items-center ${getChangeColor(previousPeriodComparison.salesChange)}`}>
              {getChangeIcon(previousPeriodComparison.salesChange)}
              <span className="ml-1">
                {formatPercentage(previousPeriodComparison.salesChange)} vs período anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">
            {totalSales} de {totalLeads} leads
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
          <div className="text-xs text-muted-foreground">
            Por venda realizada
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          {previousPeriodComparison && (
            <div className={`text-xs flex items-center ${getChangeColor(previousPeriodComparison.revenueChange)}`}>
              {getChangeIcon(previousPeriodComparison.revenueChange)}
              <span className="ml-1">
                {formatPercentage(previousPeriodComparison.revenueChange)} vs período anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
