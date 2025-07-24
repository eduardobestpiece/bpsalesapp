// Funções utilitárias extraídas de DetailTable.tsx para uso compartilhado
export function calculateCreditValue(month, baseCredit, contemplationMonth, administrator, customAnnualUpdateRate) {
  if (baseCredit === 0) return 0;
  let currentCredit = baseCredit;
  if (month === 1) return currentCredit;
  for (let m = 2; m <= month; m++) {
    const isAnnualUpdate = (m - 1) % 12 === 0;
    if (isAnnualUpdate) {
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      } else {
        const annualUpdateRate = customAnnualUpdateRate !== undefined ? customAnnualUpdateRate : (administrator.inccRate || 6);
        currentCredit = currentCredit + (currentCredit * annualUpdateRate / 100);
      }
    }
    if (m > contemplationMonth) {
      const postContemplationRate = administrator.postContemplationAdjustment || 0;
      currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
    }
  }
  return currentCredit;
}

export function calculateCreditoAcessado(month, baseCredit, contemplationMonth, administrator, customAnnualUpdateRate, embutido, maxEmbeddedPercentage) {
  if (baseCredit === 0) return 0;
  let currentCredit = baseCredit;
  let embutidoAplicado = false;
  if (month === 1) return currentCredit;
  for (let m = 2; m <= month; m++) {
    const isAnnualUpdate = (m - 1) % 12 === 0;
    if (isAnnualUpdate) {
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      } else {
        const annualUpdateRate = customAnnualUpdateRate !== undefined ? customAnnualUpdateRate : (administrator.inccRate || 6);
        currentCredit = currentCredit + (currentCredit * annualUpdateRate / 100);
      }
    }
    if (m > contemplationMonth) {
      const postContemplationRate = administrator.postContemplationAdjustment || 0;
      currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
    }
    if (embutido === 'com' && m === contemplationMonth && !embutidoAplicado) {
      const maxPct = maxEmbeddedPercentage || 25;
      currentCredit = currentCredit - (currentCredit * maxPct / 100);
      embutidoAplicado = true;
    }
  }
  return currentCredit;
}

export function generateConsortiumInstallments(params) {
  const { product, administrator, contemplationMonth, selectedCredits = [], creditoAcessado = 0, embutido = 'sem', installmentType = 'full', customAdminTaxPercent, customReserveFundPercent, customAnnualUpdateRate, maxEmbeddedPercentage } = params;
  const data = [];
  const totalMonths = product.termMonths || 240;
  const baseCredit = (product && product.nominalCreditValue !== undefined) ? product.nominalCreditValue : creditoAcessado;
  
  // Usar valores customizados se disponíveis, senão usar os valores padrão
  const adminTaxRate = customAdminTaxPercent !== undefined ? customAdminTaxPercent / 100 : (administrator.administrationRate || 0.27);
  const reserveFundRate = customReserveFundPercent !== undefined ? customReserveFundPercent / 100 : 0.01; // 1% padrão
  
  // Variáveis para controle pós-contemplação (igual à tabela)
  let saldoDevedorAcumulado = 0;
  let valorBaseInicial = 0;
  let creditoAcessadoContemplacao = 0;
  let valorParcelaFixo = 0;
  
  for (let month = 1; month <= totalMonths; month++) {
    // Calcular crédito e crédito acessado (igual à tabela)
    const credito = baseCredit; // Simplificado para manter consistência
    const creditoAcessadoMes = creditoAcessado;
    
    // Calcular taxa de administração e fundo de reserva (igual à tabela)
    let taxaAdmin, fundoReserva;
    
    if (month <= contemplationMonth) {
      // Antes da contemplação: calcula sobre o crédito normal
      taxaAdmin = credito * adminTaxRate;
      fundoReserva = credito * reserveFundRate;
    } else {
      // Após a contemplação: calcula sobre o crédito acessado da contemplação
      if (creditoAcessadoContemplacao === 0) {
        creditoAcessadoContemplacao = creditoAcessado;
      }
      taxaAdmin = creditoAcessadoContemplacao * adminTaxRate;
      fundoReserva = creditoAcessadoContemplacao * reserveFundRate;
    }
    
    // Calcular o saldo devedor (igual à tabela)
    if (month === 1) {
      // Primeiro mês: soma de Crédito + Taxa de Administração + Fundo de Reserva
      valorBaseInicial = credito + taxaAdmin + fundoReserva;
      saldoDevedorAcumulado = valorBaseInicial;
    } else if (month <= contemplationMonth) {
      // Antes da contemplação: (Crédito + Taxa + Fundo Reserva) - soma das parcelas anteriores
      const valorBase = credito + taxaAdmin + fundoReserva;
      const somaParcelasAnteriores = data.slice(0, month - 1).reduce((sum, row) => sum + row.installmentValue, 0);
      saldoDevedorAcumulado = valorBase - somaParcelasAnteriores;
    } else {
      // Após a contemplação: nova lógica baseada no crédito acessado
      if (month === contemplationMonth + 1) {
        // Primeiro mês após contemplação: saldo baseado no crédito acessado
        const valorBasePosContemplacao = creditoAcessadoContemplacao + taxaAdmin + fundoReserva;
        const somaParcelasAteContemplacao = data.slice(0, contemplationMonth).reduce((sum, row) => sum + row.installmentValue, 0);
        saldoDevedorAcumulado = valorBasePosContemplacao - somaParcelasAteContemplacao;
      } else {
        // Meses seguintes após contemplação
        const saldoAnterior = data[month - 2]?.remainingBalance || 0;
        const parcelaAnterior = data[month - 2]?.installmentValue || 0;
        
        // Verificar se é um mês de atualização anual após contemplação
        const isAnnualUpdateAfterContemplation = (month - 1) % 12 === 0 && month > contemplationMonth;
        
        if (isAnnualUpdateAfterContemplation) {
          // Atualização anual sobre o próprio saldo devedor
          const annualUpdateRate = customAnnualUpdateRate !== undefined ? customAnnualUpdateRate : (administrator.inccRate || 6);
          saldoDevedorAcumulado = saldoAnterior + (saldoAnterior * annualUpdateRate / 100) - parcelaAnterior;
        } else {
          // Mês normal após contemplação: saldo anterior menos parcela
          saldoDevedorAcumulado = saldoAnterior - parcelaAnterior;
        }
      }
    }
    
    // Calcular valor da parcela (igual à tabela)
    let installmentValue;
    
    if (month <= contemplationMonth) {
      // Antes da contemplação: usar regras da parcela (cheia ou especial)
      if (installmentType === 'full') {
        // Parcela cheia: (Valor do Crédito + Taxa de Administração + Fundo de Reserva) / Prazo
        installmentValue = (credito + taxaAdmin + fundoReserva) / totalMonths;
      } else {
        // Parcela especial: aplicar reduções conforme configuração
        const reductionPercent = 0.5; // 50% de redução padrão
        const principal = credito * (1 - reductionPercent);
        installmentValue = (principal + taxaAdmin + fundoReserva) / totalMonths;
      }
    } else {
      // Após contemplação: REGRA IGUAL PARA AMBOS OS TIPOS (igual à tabela)
      // Saldo devedor / (Prazo - número de Parcelas pagas)
      const parcelasPagas = contemplationMonth;
      const prazoRestante = totalMonths - parcelasPagas;
      
      if (month === contemplationMonth + 1) {
        // Primeiro mês após contemplação: calcular parcela fixa baseada no saldo devedor
        installmentValue = saldoDevedorAcumulado / prazoRestante;
        valorParcelaFixo = installmentValue; // Fixar o valor para os próximos meses
      } else {
        // Meses seguintes: usar o valor fixo até próxima atualização
        installmentValue = valorParcelaFixo;
        
        // Verificar se é mês de atualização anual
        const isAnnualUpdate = (month - 1) % 12 === 0 && month > contemplationMonth;
        if (isAnnualUpdate) {
          // Recalcular parcela com saldo devedor atualizado
          const parcelasPagasAteAgora = month - 1;
          const prazoRestanteAtualizado = totalMonths - parcelasPagasAteAgora;
          
          // REGRA IGUAL PARA AMBOS OS TIPOS: saldo devedor / prazo restante
          installmentValue = saldoDevedorAcumulado / prazoRestanteAtualizado;
          valorParcelaFixo = installmentValue; // Atualizar valor fixo
        }
      }
    }
    
    // Garantir que a parcela nunca seja negativa
    installmentValue = Math.max(installmentValue, 0.01);
    
    data.push({
      month,
      credit: credito,
      installmentValue,
      remainingBalance: saldoDevedorAcumulado
    });
  }
  
  return data;
} 