
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    target: number;
    percentage: number;
  }>;
}

export const PerformanceChart = ({ title, data }: PerformanceChartProps) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalTarget = data.reduce((sum, item) => sum + item.target, 0);
  const overallPerformance = totalTarget > 0 ? (totalValue / totalTarget) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {overallPerformance >= 100 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <Badge variant={overallPerformance >= 100 ? "default" : "destructive"}>
              {overallPerformance.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground">
                  {stage.value} / {stage.target} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stage.percentage >= 100 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                />
              </div>
              {stage.percentage >= 100 ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Parabéns! Meta atingida
                </p>
              ) : (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Atenção: Abaixo da meta
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
