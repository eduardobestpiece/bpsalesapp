import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DetailTableProps {
  product: any;
  administrator: any;
  contemplationMonth: number;
  selectedCredits?: any[]; // Créditos selecionados pelo usuário
  creditoAcessado?: number; // Crédito acessado total
  embutido?: 'com' | 'sem'; // Estado do embutido
}

export const DetailTable = ({ 
  product, 
  administrator, 
  contemplationMonth, 
  selectedCredits = [], 
  creditoAcessado = 0,
  embutido = 'sem'
}: DetailTableProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const [maxMonths, setMaxMonths] = useState(100);
  const [visibleColumns, setVisibleColumns] = useState({
    mes: true,
    credito: true,
    creditoAcessado: true,
    taxaAdministracao: true,
    fundoReserva: true,
    valorParcela: true,
    saldoDevedor: true,
    compraAgio: true,
    lucro: true,
    percentualLucro: true,
    lucroMes: true
  });

  // Função para calcular quando o crédito deve ser atualizado
  const shouldUpdateCredit = (month: number) => {
    // Lógica simples: atualização anual a cada 12 meses (mês 13, 25, 37, etc.)
    return (month - 1) % 12 === 0 && month > 12;
  };

  // Função para calcular o valor do crédito com atualizações
  const calculateCreditValue = (month: number, baseCredit: number) => {
    if (baseCredit === 0) return 0;
    
    let currentCredit = baseCredit;
    
    // Para o primeiro mês, retorna o valor base sem atualização
    if (month === 1) {
      return currentCredit;
    }
    
    // Calcular as atualizações mês a mês
    for (let m = 2; m <= month; m++) {
      // Verificar se é um mês de atualização anual (13, 25, 37, etc.)
      const isAnnualUpdate = (m - 1) % 12 === 0;
      
      if (isAnnualUpdate) {
        // Verificar se já passou do mês de contemplação
        if (m > contemplationMonth) {
          // Após contemplação: atualização mensal pelo ajuste pós contemplação
          const postContemplationRate = administrator.postContemplationAdjustment || 0;
          currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
        } else {
          // Antes da contemplação: atualização anual pelo INCC
          const inccRate = administrator.inccRate || 6; // Taxa INCC padrão
          currentCredit = currentCredit + (currentCredit * inccRate / 100);
        }
      }
      
      // Após contemplação, aplicar atualização mensal em todos os meses
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      }
    }
    
    return currentCredit;
  };

  // Função para calcular o crédito acessado com embutido
  const calculateCreditoAcessado = (month: number, baseCredit: number) => {
    if (baseCredit === 0) return 0;
    
    let currentCredit = baseCredit;
    let embutidoAplicado = false;
    
    // Para o primeiro mês, retorna o valor base sem atualização
    if (month === 1) {
      return currentCredit;
    }
    
    // Calcular as atualizações mês a mês
    for (let m = 2; m <= month; m++) {
      // Verificar se é um mês de atualização anual (13, 25, 37, etc.)
      const isAnnualUpdate = (m - 1) % 12 === 0;
      
      if (isAnnualUpdate) {
        // Verificar se já passou do mês de contemplação
        if (m > contemplationMonth) {
          // Após contemplação: atualização mensal pelo ajuste pós contemplação
          const postContemplationRate = administrator.postContemplationAdjustment || 0;
          currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
        } else {
          // Antes da contemplação: atualização anual pelo INCC
          const inccRate = administrator.inccRate || 6; // Taxa INCC padrão
          currentCredit = currentCredit + (currentCredit * inccRate / 100);
        }
      }
      
      // Após contemplação, aplicar atualização mensal em todos os meses
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      }
      
      // Aplicar redução do embutido no mês de contemplação se "Com embutido" estiver selecionado
      if (embutido === 'com' && m === contemplationMonth && !embutidoAplicado) {
        const maxEmbeddedPercentage = administrator.maxEmbeddedPercentage || 25; // 25% padrão
        currentCredit = currentCredit - (currentCredit * maxEmbeddedPercentage / 100);
        embutidoAplicado = true;
      }
    }
    
    return currentCredit;
  };

  // Gerar dados da tabela
  const generateTableData = () => {
    const data = [];
    const totalMonths = Math.min(maxMonths, product.termMonths || 240);
    
    // Determinar o valor base do crédito
    const baseCredit = selectedCredits.length > 0 
      ? selectedCredits.reduce((sum, credit) => sum + (credit.value || 0), 0)
      : creditoAcessado || 0;
    
    let saldoDevedorAcumulado = 0;
    let valorBaseInicial = 0; // Valor base para cálculo antes da contemplação
    let creditoAcessadoContemplacao = 0; // Valor do crédito acessado no mês de contemplação
    
    for (let month = 1; month <= totalMonths; month++) {
      const credito = calculateCreditValue(month, baseCredit);
      const creditoAcessado = calculateCreditoAcessado(month, baseCredit);
      
      // Calcular taxa de administração e fundo de reserva
      let taxaAdmin, fundoReserva;
      
      if (month <= contemplationMonth) {
        // Antes da contemplação: calcula sobre o crédito normal
        taxaAdmin = credito * (administrator.administrationRate || 0.27);
        fundoReserva = credito * 0.01; // 1%
      } else {
        // Após a contemplação: calcula sobre o crédito acessado da contemplação
        if (creditoAcessadoContemplacao === 0) {
          // Se ainda não temos o valor da contemplação, calcula baseado no mês de contemplação
          const creditoContemplacao = calculateCreditValue(contemplationMonth, baseCredit);
          const creditoAcessadoContemplacaoTemp = calculateCreditoAcessado(contemplationMonth, baseCredit);
          creditoAcessadoContemplacao = creditoAcessadoContemplacaoTemp;
        }
        
        taxaAdmin = creditoAcessadoContemplacao * (administrator.administrationRate || 0.27);
        fundoReserva = creditoAcessadoContemplacao * 0.01; // 1%
      }
      
      // Calcular o saldo devedor
      if (month === 1) {
        // Primeiro mês: soma de Crédito + Taxa de Administração + Fundo de Reserva
        valorBaseInicial = credito + taxaAdmin + fundoReserva;
        saldoDevedorAcumulado = valorBaseInicial;
      } else if (month <= contemplationMonth) {
        // Antes da contemplação: (Crédito + Taxa + Fundo Reserva) - soma das parcelas anteriores
        const valorBase = credito + taxaAdmin + fundoReserva;
        const somaParcelasAnteriores = data.slice(0, month - 1).reduce((sum, row) => sum + row.valorParcela, 0);
        saldoDevedorAcumulado = valorBase - somaParcelasAnteriores;
      } else {
        // Após a contemplação: nova lógica baseada no crédito acessado
        if (month === contemplationMonth + 1) {
          // Primeiro mês após contemplação: saldo baseado no crédito acessado
          const valorBasePosContemplacao = creditoAcessadoContemplacao + taxaAdmin + fundoReserva;
          const somaParcelasAteContemplacao = data.slice(0, contemplationMonth).reduce((sum, row) => sum + row.valorParcela, 0);
          saldoDevedorAcumulado = valorBasePosContemplacao - somaParcelasAteContemplacao;
        } else {
          // Meses seguintes após contemplação
          const saldoAnterior = data[month - 2]?.saldoDevedor || 0;
          const parcelaAnterior = data[month - 2]?.valorParcela || 0;
          
          // Verificar se é um mês de atualização anual após contemplação
          const isAnnualUpdateAfterContemplation = (month - 1) % 12 === 0 && month > contemplationMonth;
          
          if (isAnnualUpdateAfterContemplation) {
            // Atualização anual sobre o próprio saldo devedor
            const inccRate = administrator.inccRate || 6;
            saldoDevedorAcumulado = saldoAnterior + (saldoAnterior * inccRate / 100) - parcelaAnterior;
          } else {
            // Mês normal após contemplação: saldo anterior menos parcela
            saldoDevedorAcumulado = saldoAnterior - parcelaAnterior;
          }
        }
      }
      
      // Calcular valor da parcela
      let valorParcela;
      if (month <= contemplationMonth) {
        valorParcela = (credito + taxaAdmin + fundoReserva) / (product.termMonths || 240);
      } else {
        // Após contemplação: parcela baseada no crédito acessado
        valorParcela = (creditoAcessadoContemplacao + taxaAdmin + fundoReserva) / (product.termMonths || 240);
      }
      
      const compraAgio = credito * 0.05; // 5%
      const lucro = credito - compraAgio;
      const percentualLucro = (lucro / compraAgio) * 100;
      const lucroMes = lucro / (product.termMonths || 240);
      
      // Destacar linha do mês de contemplação
      const isContemplationMonth = month === contemplationMonth;
      
      data.push({
        mes: month,
        credito,
        creditoAcessado,
        taxaAdministracao: taxaAdmin,
        fundoReserva,
        valorParcela,
        saldoDevedor: saldoDevedorAcumulado,
        compraAgio,
        lucro,
        percentualLucro,
        lucroMes,
        isContemplationMonth
      });
    }
    
    return data;
  };

  const tableData = generateTableData();

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Detalhamento do Consórcio</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Configurar
            {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {showConfig && (
        <CardContent className="border-b">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Máximo de meses a exibir:</label>
              <input
                type="number"
                value={maxMonths}
                onChange={(e) => setMaxMonths(Number(e.target.value))}
                min="1"
                max={product.termMonths || 240}
                className="ml-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-24 bg-gray-800 dark:bg-gray-700 text-gray-100 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Colunas visíveis:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(visibleColumns).map(([key, visible]) => (
                  <Badge
                    key={key}
                    variant={visible ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleColumn(key)}
                  >
                    {key === 'mes' && 'Mês'}
                    {key === 'credito' && 'Crédito'}
                    {key === 'creditoAcessado' && 'Crédito Acessado'}
                    {key === 'taxaAdministracao' && 'Taxa de Administração'}
                    {key === 'fundoReserva' && 'Fundo de Reserva'}
                    {key === 'valorParcela' && 'Valor da Parcela'}
                    {key === 'saldoDevedor' && 'Saldo Devedor'}
                    {key === 'compraAgio' && 'Compra do Ágio'}
                    {key === 'lucro' && 'Lucro'}
                    {key === 'percentualLucro' && 'Percentual de Lucro'}
                    {key === 'lucroMes' && 'Lucro ao Mês'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}

      <CardContent>
        <div className="w-full overflow-x-auto border rounded-lg" style={{ maxHeight: '400px' }}>
          <div className="min-w-max">
            <Table>
            <TableHeader className="sticky top-0 z-10" style={{ backgroundColor: '#131313' }}>
              <TableRow>
                {visibleColumns.mes && <TableHead>Mês</TableHead>}
                {visibleColumns.credito && <TableHead>Crédito</TableHead>}
                {visibleColumns.creditoAcessado && <TableHead>Crédito Acessado</TableHead>}
                {visibleColumns.taxaAdministracao && <TableHead>Taxa de Administração</TableHead>}
                {visibleColumns.fundoReserva && <TableHead>Fundo de Reserva</TableHead>}
                {visibleColumns.valorParcela && <TableHead>Valor da Parcela</TableHead>}
                {visibleColumns.saldoDevedor && <TableHead>Saldo Devedor</TableHead>}
                {visibleColumns.compraAgio && <TableHead>Compra do Ágio</TableHead>}
                {visibleColumns.lucro && <TableHead>Lucro</TableHead>}
                {visibleColumns.percentualLucro && <TableHead>Percentual de Lucro</TableHead>}
                {visibleColumns.lucroMes && <TableHead>Lucro ao Mês</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow 
                  key={row.mes}
                  className={row.isContemplationMonth ? "bg-green-100 dark:bg-green-900" : ""}
                >
                  {visibleColumns.mes && <TableCell>{row.mes}</TableCell>}
                  {visibleColumns.credito && <TableCell>{formatCurrency(row.credito)}</TableCell>}
                  {visibleColumns.creditoAcessado && <TableCell>{formatCurrency(row.creditoAcessado)}</TableCell>}
                  {visibleColumns.taxaAdministracao && <TableCell>{formatCurrency(row.taxaAdministracao)}</TableCell>}
                  {visibleColumns.fundoReserva && <TableCell>{formatCurrency(row.fundoReserva)}</TableCell>}
                  {visibleColumns.valorParcela && <TableCell>{formatCurrency(row.valorParcela)}</TableCell>}
                  {visibleColumns.saldoDevedor && <TableCell>{formatCurrency(row.saldoDevedor)}</TableCell>}
                  {visibleColumns.compraAgio && <TableCell>{formatCurrency(row.compraAgio)}</TableCell>}
                  {visibleColumns.lucro && <TableCell>{formatCurrency(row.lucro)}</TableCell>}
                  {visibleColumns.percentualLucro && <TableCell>{row.percentualLucro}%</TableCell>}
                  {visibleColumns.lucroMes && <TableCell>{formatCurrency(row.lucroMes)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}; 