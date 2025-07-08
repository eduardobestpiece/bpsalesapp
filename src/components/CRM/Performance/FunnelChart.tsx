
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface FunnelStageData {
  id: string;
  name: string;
  actual: number;
  target: number;
  targetPercentage?: number;
  conversionRate?: number;
}

interface FunnelChartProps {
  stages: FunnelStageData[];
  title: string;
}

export const FunnelChart = ({ stages, title }: FunnelChartProps) => {
  const calculateConversionRate = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 0;
    return Math.round((currentValue / previousValue) * 100);
  };

  const getPerformanceStatus = (actual: number, target: number) => {
    if (actual >= target) return 'success';
    if (actual >= target * 0.8) return 'warning';
    return 'danger';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'danger': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'danger': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusMessage = (status: string, stageName: string) => {
    switch (status) {
      case 'success': 
        return `Parabéns! A etapa "${stageName}" está acima da meta.`;
      case 'warning': 
        return `Atenção! A etapa "${stageName}" está próxima da meta.`;
      case 'danger': 
        return `Cuidado! A etapa "${stageName}" está muito abaixo da meta.`;
      default: 
        return '';
    }
  };

  // Calculate overall conversion from first to last stage
  const overallConversion = stages.length > 1 
    ? calculateConversionRate(stages[stages.length - 1].actual, stages[0].actual)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">
            Conversão Geral: {overallConversion}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const status = getPerformanceStatus(stage.actual, stage.target);
            const conversionFromPrevious = index > 0 
              ? calculateConversionRate(stage.actual, stages[index - 1].actual)
              : 100;

            return (
              <div key={stage.id} className="relative">
                {/* Stage Bar */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{stage.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">{stage.actual}</span>
                        <span className="text-sm text-muted-foreground">
                          / {stage.target}
                        </span>
                        {index > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {conversionFromPrevious}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          status === 'success' ? 'bg-green-500' :
                          status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min((stage.actual / stage.target) * 100, 100)}%` 
                        }}
                      />
                      {stage.actual > stage.target && (
                        <div className="absolute inset-0 bg-green-500 opacity-20" />
                      )}
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>

                {/* Connection Line to Next Stage */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="w-0.5 h-6 bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Performance Alerts */}
        <div className="space-y-2">
          {stages.map((stage) => {
            const status = getPerformanceStatus(stage.actual, stage.target);
            if (status === 'success') {
              return (
                <Alert key={stage.id} className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {getStatusMessage(status, stage.name)}
                  </AlertDescription>
                </Alert>
              );
            } else if (status === 'danger') {
              return (
                <Alert key={stage.id} className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {getStatusMessage(status, stage.name)}
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
};
