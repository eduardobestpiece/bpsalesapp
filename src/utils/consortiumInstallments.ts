// Funções utilitárias extraídas de DetailTable.tsx para uso compartilhado

// Nova função para calcular entradas especiais
export function calculateSpecialEntry(administrator, baseCredit, month) {
  // Se não há entrada especial configurada, retorna 0
  if (!administrator.special_entry_type || administrator.special_entry_type === 'none') {
    return 0;
  }

  const specialEntryInstallments = typeof administrator.special_entry_installments === 'string' 
    ? parseInt(administrator.special_entry_installments) 
    : (administrator.special_entry_installments || 1);
  
  // Verificar se estamos dentro do período de cobrança da entrada especial
  if (month > specialEntryInstallments) {
    return 0;
  }

  let specialEntryValue = 0;

  if (administrator.special_entry_type === 'percentage') {
    // Percentual do crédito - converter para número se for string
    const percentage = typeof administrator.special_entry_percentage === 'string' 
      ? parseFloat(administrator.special_entry_percentage) 
      : (administrator.special_entry_percentage || 0);
    specialEntryValue = (baseCredit * percentage) / 100;
  } else if (administrator.special_entry_type === 'fixed_value') {
    // Valor fixo - converter para número se for string
    const fixedValue = typeof administrator.special_entry_fixed_value === 'string' 
      ? parseFloat(administrator.special_entry_fixed_value) 
      : (administrator.special_entry_fixed_value || 0);
    specialEntryValue = fixedValue;
  }

  // Dividir pelo número de parcelas da entrada
  return specialEntryValue / specialEntryInstallments;
}

// Função para calcular o impacto da entrada especial no saldo devedor
export function calculateSpecialEntryImpact(administrator, baseCredit, month) {
  const specialEntryValue = calculateSpecialEntry(administrator, baseCredit, month);
  
  if (specialEntryValue === 0) {
    return { additionalDebt: 0, includedDebt: 0 };
  }

  if (administrator.functioning === 'additional') {
    // Adicional: aumenta o saldo devedor
    return { additionalDebt: specialEntryValue, includedDebt: 0 };
  } else {
    // Incluso: não aumenta o saldo devedor (já está incluso)
    return { additionalDebt: 0, includedDebt: specialEntryValue };
  }
}

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
    // Aplicar redução do embutido no mês de contemplação se "Com embutido" estiver selecionado
    if (embutido === 'com' && m === contemplationMonth && !embutidoAplicado) {
      const maxPct = administrator.maxEmbeddedPercentage ?? 25; // Usar o valor da administradora (mesmo se for 0)
      currentCredit = currentCredit - (currentCredit * maxPct / 100);
      embutidoAplicado = true;
    }
  }
  return currentCredit;
}

export function generateConsortiumInstallments(params) {
  const { product, administrator, contemplationMonth, selectedCredits = [], creditoAcessado = 0, embutido = 'sem', installmentType = 'full', customAdminTaxPercent, customReserveFundPercent, customAnnualUpdateRate, maxEmbeddedPercentage, specialEntryEnabled = true } = params;
  const data = [];
  const totalMonths = product.termMonths || 240;
  const baseCredit = (product && product.nominalCreditValue !== undefined) ? product.nominalCreditValue : creditoAcessado;
  
  // Usar valores customizados se disponíveis, senão usar os valores padrão
  const adminTaxRate = customAdminTaxPercent !== undefined ? customAdminTaxPercent / 100 : (administrator.administrationRate || 0.27);
  const reserveFundRate = customReserveFundPercent !== undefined ? customReserveFundPercent / 100 : 0.01; // 1% padrão
  
  // Variáveis para controle pós-contemplação
  let saldoDevedorAcumulado = 0;
  let valorBaseInicial = 0;
  let creditoAcessadoContemplacao = 0;
  let valorParcelaFixo = 0;
  
  for (let month = 1; month <= totalMonths; month++) {
    // Calcular crédito e crédito acessado
    const credito = baseCredit;
    const creditoAcessadoMes = creditoAcessado;
    
    // Calcular entrada especial
    const specialEntryValue = specialEntryEnabled ? calculateSpecialEntry(administrator, baseCredit, month) : 0;
    const specialEntryImpact = specialEntryEnabled ? calculateSpecialEntryImpact(administrator, baseCredit, month) : { additionalDebt: 0, includedDebt: 0 };
    
    // Calcular taxa de administração e fundo de reserva
    let taxaAdmin, fundoReserva;
    
    if (month < contemplationMonth) {
      // Antes da contemplação: calcula sobre o crédito normal
      taxaAdmin = credito * adminTaxRate;
      fundoReserva = credito * reserveFundRate;
    } else if (month === contemplationMonth) {
      // Mês da contemplação: calcula sobre o crédito NORMAL (sem redução do embutido)
      // Taxa de admin e fundo de reserva NUNCA são reduzidos pelo embutido
      taxaAdmin = credito * adminTaxRate;
      fundoReserva = credito * reserveFundRate;
    } else {
      // Após a contemplação: zerados (incorporados no saldo devedor)
      taxaAdmin = 0;
      fundoReserva = 0;
    }
    
    // Calcular o saldo devedor
    if (month === 1) {
      // Primeiro mês: soma de Crédito + Taxa de Administração + Fundo de Reserva + Entrada Especial Adicional
      valorBaseInicial = credito + taxaAdmin + fundoReserva + specialEntryImpact.additionalDebt;
      saldoDevedorAcumulado = valorBaseInicial;
    } else if (month < contemplationMonth) {
      // Antes da contemplação: (Crédito + Taxa + Fundo Reserva + Entrada Especial Adicional) - soma das parcelas anteriores
      const valorBase = credito + taxaAdmin + fundoReserva + specialEntryImpact.additionalDebt;
      const somaParcelasAnteriores = data.slice(0, month - 1).reduce((sum, row) => sum + row.installmentValue, 0);
      saldoDevedorAcumulado = valorBase - somaParcelasAnteriores;
    } else if (month === contemplationMonth) {
      // Mês da contemplação: saldo baseado no crédito NORMAL + taxa admin + fundo reserva + entrada especial adicional
      // Depois aplicar redução do embutido somente no CRÉDITO ACESSADO
      const somaParcelasAteContemplacao = data.slice(0, contemplationMonth - 1).reduce((sum, row) => sum + row.installmentValue, 0);
      
      // Saldo devedor = (Crédito acessado + Taxa admin + Fundo reserva + Entrada Especial Adicional) - Parcelas pagas
      // Onde taxa admin e fundo reserva são calculados sobre crédito normal (sem embutido)
      let saldoDevedorPosContemplacao = creditoAcessadoMes + taxaAdmin + fundoReserva + specialEntryImpact.additionalDebt - somaParcelasAteContemplacao;
      
      saldoDevedorAcumulado = saldoDevedorPosContemplacao;
    } else {
      // Após a contemplação
      if (month === contemplationMonth + 1) {
        // Primeiro mês após contemplação: usar saldo anterior menos parcela
        const saldoAnterior = data[month - 2]?.remainingBalance || 0;
        const parcelaAnterior = data[month - 2]?.installmentValue || 0;
        saldoDevedorAcumulado = saldoAnterior - parcelaAnterior;
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
    
    // Calcular valor da parcela
    let installmentValue;
    
    if (month < contemplationMonth) {
      // Antes da contemplação: usar regras da parcela (cheia ou especial)
      if (installmentType === 'full') {
        // Parcela cheia: (Valor do Crédito + Taxa de Administração + Fundo de Reserva + Entrada Especial) / Prazo
        installmentValue = (credito + taxaAdmin + fundoReserva + specialEntryValue) / totalMonths;
      } else {
        // Parcela especial: aplicar reduções conforme configuração
        const reductionPercent = 0.5; // 50% de redução padrão
        const principal = credito * (1 - reductionPercent);
        installmentValue = (principal + taxaAdmin + fundoReserva + specialEntryValue) / totalMonths;
      }
    } else if (month === contemplationMonth) {
      // Mês da contemplação: usar valor fixo baseado no primeiro mês + entrada especial
      if (installmentType === 'full') {
        installmentValue = (baseCredit + (baseCredit * adminTaxRate) + (baseCredit * reserveFundRate) + specialEntryValue) / totalMonths;
      } else {
        const reductionPercent = 0.5;
        const principal = baseCredit * (1 - reductionPercent);
        installmentValue = (principal + (baseCredit * adminTaxRate) + (baseCredit * reserveFundRate) + specialEntryValue) / totalMonths;
      }
    } else {
      // Após contemplação: REGRA IGUAL PARA AMBOS OS TIPOS
      // Saldo devedor / (Prazo - número de Parcelas pagas) + entrada especial se aplicável
      const parcelasPagas = contemplationMonth;
      const prazoRestante = totalMonths - parcelasPagas;
      
      if (month === contemplationMonth + 1) {
        // Primeiro mês após contemplação: calcular parcela fixa baseada no saldo devedor
        // O saldo devedor já foi calculado com a redução do embutido aplicada
        installmentValue = saldoDevedorAcumulado / prazoRestante + specialEntryValue;
        valorParcelaFixo = installmentValue; // Fixar o valor para os próximos meses
      } else {
        // Meses seguintes: usar o valor fixo até próxima atualização
        installmentValue = valorParcelaFixo + specialEntryValue;
        
        // Verificar se é mês de atualização anual
        const isAnnualUpdate = (month - 1) % 12 === 0 && month > contemplationMonth;
        if (isAnnualUpdate) {
          // Recalcular parcela com saldo devedor atualizado
          const parcelasPagasAteAgora = month - 1;
          const prazoRestanteAtualizado = totalMonths - parcelasPagasAteAgora;
          
          // REGRA IGUAL PARA AMBOS OS TIPOS: saldo devedor / prazo restante + entrada especial
          installmentValue = saldoDevedorAcumulado / prazoRestanteAtualizado + specialEntryValue;
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
      remainingBalance: saldoDevedorAcumulado,
      specialEntryValue,
      specialEntryType: administrator.special_entry_type,
      functioning: administrator.functioning
    });
  }
  
  return data;
}