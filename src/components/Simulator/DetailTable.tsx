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
    seguro: true,
    somaCredito: true,
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
    
    // Para os primeiros 12 meses, retorna o valor base sem atualização
    if (month <= 12) {
      return currentCredit;
    }
    
    // Calcular as atualizações mês a mês
    for (let m = 13; m <= month; m++) {
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
    
    // Para os primeiros 12 meses, retorna o valor base sem atualização
    if (month <= 12) {
      return currentCredit;
    }
    
    // Calcular as atualizações mês a mês
    for (let m = 13; m <= month; m++) {
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
    
    for (let month = 1; month <= totalMonths; month++) {
      const credito = calculateCreditValue(month, baseCredit);
      const creditoAcessado = calculateCreditoAcessado(month, baseCredit);
      const taxaAdmin = credito * (administrator.administrationRate || 0.27);
      const fundoReserva = credito * 0.01; // 1%
      const seguro = (credito * 0.01) / 12; // 1%
      const somaCredito = credito + fundoReserva + taxaAdmin;
      const valorParcela = somaCredito / (product.termMonths || 240);
      const saldoDevedor = credito - (valorParcela * month);
      
      data.push({
        mes: month,
        credito,
        creditoAcessado,
        taxaAdministracao: taxaAdmin,
        fundoReserva,
        seguro,
        somaCredito,
        valorParcela,
        saldoDevedor: Math.max(0, saldoDevedor),
        compraAgio: 0, // Placeholder
        lucro: 0, // Placeholder
        percentualLucro: 0, // Placeholder
        lucroMes: 0 // Placeholder
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
                    {key === 'seguro' && 'Seguro'}
                    {key === 'somaCredito' && 'Soma do Crédito'}
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
            <TableHeader>
              <TableRow>
                {visibleColumns.mes && <TableHead>Mês</TableHead>}
                {visibleColumns.credito && <TableHead>Crédito</TableHead>}
                {visibleColumns.creditoAcessado && <TableHead>Crédito Acessado</TableHead>}
                {visibleColumns.taxaAdministracao && <TableHead>Taxa de Administração</TableHead>}
                {visibleColumns.fundoReserva && <TableHead>Fundo de Reserva</TableHead>}
                {visibleColumns.seguro && <TableHead>Seguro</TableHead>}
                {visibleColumns.somaCredito && <TableHead>Soma do Crédito</TableHead>}
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
                  className={row.mes === contemplationMonth ? "bg-green-100 dark:bg-green-900" : ""}
                >
                  {visibleColumns.mes && <TableCell>{row.mes}</TableCell>}
                  {visibleColumns.credito && <TableCell>{formatCurrency(row.credito)}</TableCell>}
                  {visibleColumns.creditoAcessado && <TableCell>{formatCurrency(row.creditoAcessado)}</TableCell>}
                  {visibleColumns.taxaAdministracao && <TableCell>{formatCurrency(row.taxaAdministracao)}</TableCell>}
                  {visibleColumns.fundoReserva && <TableCell>{formatCurrency(row.fundoReserva)}</TableCell>}
                  {visibleColumns.seguro && <TableCell>{formatCurrency(row.seguro)}</TableCell>}
                  {visibleColumns.somaCredito && <TableCell>{formatCurrency(row.somaCredito)}</TableCell>}
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