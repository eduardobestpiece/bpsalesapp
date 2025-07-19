
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CapitalGainProps {
  contemplationMonth: number;
  creditoAcessado: number;
  tableData: any[];
}

export const CapitalGain = ({ contemplationMonth, creditoAcessado, tableData }: CapitalGainProps) => {
  const [agioPercent, setAgioPercent] = useState(5); // 5% padrão
  const [valorAgio, setValorAgio] = useState(0);
  const [somaParcelasPagas, setSomaParcelasPagas] = useState(0);
  const [valorLucro, setValorLucro] = useState(0);
  const [roiOperacao, setRoiOperacao] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calcular dados quando as dependências mudarem
  useEffect(() => {
    if (!tableData || tableData.length === 0 || !creditoAcessado) return;

    // Calcular soma das parcelas pagas até a contemplação
    const parcelasAteContemplacao = tableData
      .filter(row => row.mes <= contemplationMonth)
      .reduce((sum, row) => sum + row.valorParcela, 0);
    
    setSomaParcelasPagas(parcelasAteContemplacao);

    // Calcular valor do ágio
    const agioValue = creditoAcessado * (agioPercent / 100);
    setValorAgio(agioValue);

    // Calcular valor do lucro
    const lucroValue = agioValue - parcelasAteContemplacao;
    setValorLucro(lucroValue);

    // Calcular ROI da operação
    const roiValue = parcelasAteContemplacao > 0 ? (agioValue / parcelasAteContemplacao) * 100 : 0;
    setRoiOperacao(roiValue);

    // Gerar dados do gráfico
    const chartDataTemp = tableData
      .map(row => {
        const parcelasAteMes = tableData
          .filter(r => r.mes <= row.mes)
          .reduce((sum, r) => sum + r.valorParcela, 0);
        
        const lucroMes = agioValue - parcelasAteMes;
        
        return {
          mes: row.mes,
          lucro: lucroMes,
          parcelasPagas: parcelasAteMes
        };
      })
      .filter(item => item.lucro > 0) // Apenas meses com lucro positivo
      .sort((a, b) => a.lucro - b.lucro); // Ordenar do menor para maior lucro

    setChartData(chartDataTemp);
  }, [tableData, creditoAcessado, contemplationMonth, agioPercent]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Ganho de Capital</h2>
      </div>

      {/* Campos de entrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ágio (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="agio-percent">Percentual do Ágio</Label>
              <Input
                id="agio-percent"
                type="number"
                value={agioPercent}
                onChange={(e) => setAgioPercent(Number(e.target.value))}
                min="0"
                max="100"
                step="0.1"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Valor do Ágio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(valorAgio)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Soma das Parcelas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(somaParcelasPagas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Valor do Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${valorLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(valorLucro)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">ROI da Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roiOperacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roiOperacao.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Lucro por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    label={{ value: 'Mês', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Lucro (R$)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Lucro']}
                    labelFormatter={(label) => `Mês ${label}`}
                  />
                  <Bar dataKey="lucro" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <p>Nenhum dado disponível para o gráfico</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
