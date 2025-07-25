// Regra da Parcela Especial
// Calcula o valor da parcela especial (reduzida) conforme regra oficial do projeto

export interface RegraParcelaEspecialParams {
  credit: number;
  installment: {
    installment_count: number;
    admin_tax_percent: number;
    reserve_fund_percent: number;
    insurance_percent: number;
    optional_insurance: boolean;
  };
  reduction?: {
    reduction_percent: number;
    applications: string[];
  } | null;
}

export function regraParcelaEspecial({ credit, installment, reduction }: RegraParcelaEspecialParams): number {
  console.log('🔍 [CÁLCULO PARCELA ESPECIAL] Iniciando cálculo:', {
    credit,
    installment,
    reduction
  });

  const nParcelas = installment.installment_count;
  const taxaAdm = installment.admin_tax_percent || 0;
  const fundoReserva = installment.reserve_fund_percent || 0;
  const seguro = installment.optional_insurance ? 0 : (installment.insurance_percent || 0);
  
  console.log('🔍 [CÁLCULO PARCELA ESPECIAL] Parâmetros extraídos:', {
    nParcelas,
    taxaAdm,
    fundoReserva,
    seguro,
    optionalInsurance: installment.optional_insurance
  });

  // Extrai informações da redução
  let percentualReducao = 0;
  let aplicaParcela = false, aplicaTaxaAdm = false, aplicaFundoReserva = false, aplicaSeguro = false;
  if (reduction) {
    percentualReducao = reduction.reduction_percent / 100;
    aplicaParcela = reduction.applications?.includes('installment');
    aplicaTaxaAdm = reduction.applications?.includes('admin_tax');
    aplicaFundoReserva = reduction.applications?.includes('reserve_fund');
    aplicaSeguro = reduction.applications?.includes('insurance');
    
    console.log('🔍 [CÁLCULO PARCELA ESPECIAL] Redução aplicada:', {
      percentualReducao,
      aplicaParcela,
      aplicaTaxaAdm,
      aplicaFundoReserva,
      aplicaSeguro
    });
  }
  
  // Principal reduzido
  const principal = aplicaParcela ? credit - (credit * percentualReducao) : credit;
  
  // Taxa de administração reduzida
  const taxa = aplicaTaxaAdm
    ? (credit * taxaAdm / 100) - ((credit * taxaAdm / 100) * percentualReducao)
    : (credit * taxaAdm / 100);
  
  // Fundo de reserva reduzido
  const fundo = aplicaFundoReserva
    ? (credit * fundoReserva / 100) - ((credit * fundoReserva / 100) * percentualReducao)
    : (credit * fundoReserva / 100);
  
  // Seguro reduzido (só se não for opcional)
  let seguroValor = 0;
  if (!installment.optional_insurance) {
    seguroValor = aplicaSeguro
      ? (credit * seguro / 100) - ((credit * seguro / 100) * percentualReducao)
      : (credit * seguro / 100);
  }
  
  // Parcela especial (reduzida)
  const valorEspecial = (principal + taxa + fundo + seguroValor) / nParcelas;
  
  console.log('🔍 [CÁLCULO PARCELA ESPECIAL] Cálculo detalhado:', {
    principal,
    taxa,
    fundo,
    seguroValor,
    totalComReducao: principal + taxa + fundo + seguroValor,
    valorEspecial
  });
  
  console.log('🔍 [CÁLCULO PARCELA ESPECIAL] Resultado final:', valorEspecial);
  
  return valorEspecial;
} 