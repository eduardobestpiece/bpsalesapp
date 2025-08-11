
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Administrator, Product, Property } from '@/types/entities';
import { useAdvancedCalculations } from '@/hooks/useAdvancedCalculations';
import { formatCurrency, formatPercentage } from '@/utils/calculationHelpers';
import { Calculator, TrendingUp, DollarSign, PieChart, Building } from 'lucide-react';

interface AdvancedResultsPanelProps {
  administrator: Administrator;
  product: Product;
  property?: Property;
  contemplationMonth: number;
  installmentType: 'full' | 'half' | 'reduced';
  showResults: boolean;
}

export const AdvancedResultsPanel = ({
  administrator,
  product,
  property,
  contemplationMonth,
  installmentType,
  showResults
}: AdvancedResultsPanelProps) => {
  const {
    installmentCalculations,
    postContemplationCalculations,
    capitalGainCalculations,
    leverageCalculations,
    summaryIndicators
  } = useAdvancedCalculations({
    administrator,
    product,
    property,
    contemplationMonth,
    installmentType
  });

  if (!showResults) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Calculator className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Configure as entidades e clique em "Calcular" para ver os resultados detalhados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Resultados Avançados da Simulação</h2>
        
        {/* Indicadores Resumidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Valor Final do Crédito</div>
              <div className="text-xl font-bold text-amber-600">
                {formatCurrency(summaryIndicators.finalCreditValue)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Pago pelo Consórcio</div>
              <div className="text-xl font-bold">
                {formatCurrency(summaryIndicators.totalPaidByConsortium)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPercentage(summaryIndicators.percentagePaidByConsortium)} do total
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Ganho de Capital</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(summaryIndicators.totalCapitalGain)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">ROI Final</div>
              <div className="text-xl font-bold text-blue-600">
                {formatPercentage(summaryIndicators.finalROI)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="installments" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="installments">Parcelas</TabsTrigger>
            <TabsTrigger value="post-contemplation">Pós-Contemplação</TabsTrigger>
            <TabsTrigger value="capital-gain">Ganho Capital</TabsTrigger>
            <TabsTrigger value="leverage">Alavancagem</TabsTrigger>
          </TabsList>

          {/* Tabela de Parcelas */}
          <TabsContent value="installments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Evolução das Parcelas Mensais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead>Valor Crédito</TableHead>
                        <TableHead>Parcela Cheia</TableHead>
                        <TableHead>Meia Parcela</TableHead>
                        <TableHead>Parcela Reduzida</TableHead>
                        <TableHead>Taxa Admin</TableHead>
                        <TableHead>Seguro + F.R.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installmentCalculations.slice(0, 24).map((calc) => (
                        <TableRow key={calc.month}>
                          <TableCell>{calc.month}</TableCell>
                          <TableCell>{formatCurrency(calc.creditValue)}</TableCell>
                          <TableCell>{formatCurrency(calc.fullInstallment)}</TableCell>
                          <TableCell>{formatCurrency(calc.halfInstallment)}</TableCell>
                          <TableCell>{formatCurrency(calc.reducedInstallment)}</TableCell>
                          <TableCell>{formatCurrency(calc.adminTax)}</TableCell>
                          <TableCell>{formatCurrency(calc.reserveFund + calc.insurance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando primeiros 24 meses. Total: {installmentCalculations.length} meses.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pós-Contemplação */}
          <TabsContent value="post-contemplation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Parcelas Pós-Contemplação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postContemplationCalculations.length > 0 ? (
                  <>
                    <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={postContemplationCalculations.slice(0, 36)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Line
                            type="monotone"
                            dataKey="postContemplationInstallment"
                            stroke="var(--brand-primary)"
                            strokeWidth={2}
                            name="Parcela Pós-Contemplação"
                          />
                          <Line
                            type="monotone"
                            dataKey="remainingBalance"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Saldo Devedor"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Contemplação no Mês</div>
                        <div className="text-2xl font-bold">{contemplationMonth}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Parcela Pós-Contemplação</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(postContemplationCalculations[0]?.postContemplationInstallment || 0)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Configurar mês de contemplação para ver os cálculos pós-contemplação
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ganho de Capital */}
          <TabsContent value="capital-gain">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Análise de Ganho de Capital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  Funcionalidade de ganho de capital será implementada com base nos parâmetros de deságio
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alavancagem Patrimonial */}
          <TabsContent value="leverage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Alavancagem Patrimonial
                </CardTitle>
              </CardHeader>
              <CardContent>
                {property && leverageCalculations.length > 0 ? (
                  <>
                    <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leverageCalculations.slice(0, 24)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="cashFlow" fill="var(--brand-primary)" name="Fluxo de Caixa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Tipo do Imóvel</div>
                        <div className="text-lg font-bold capitalize">{property.type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Fluxo de Caixa Total</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(summaryIndicators.totalCashFlow)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">ROI Acumulado</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPercentage(summaryIndicators.finalROI)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Configure um imóvel para análise de alavancagem patrimonial
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Badge Final */}
        <div className="flex justify-center mt-6">
          <Badge variant="outline" className="text-lg p-3">
            {administrator.name} • {product.name} • Contemplação no mês {contemplationMonth}
          </Badge>
        </div>
      </div>
    </div>
  );
};
