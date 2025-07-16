/**
 * Utilitário para cálculos da parcela pós-contemplação
 * Implementa as fórmulas corretas para os cálculos de atualizações do crédito,
 * saldo devedor e parcela pós-contemplação
 */

/**
 * Calcula as atualizações do crédito a cada 12 meses
 * @param initialCredit Valor inicial do crédito
 * @param updateRate Taxa de atualização anual (em %)
 * @param totalMonths Total de meses para calcular as atualizações
 * @returns Valor do crédito atualizado
 */
export const calculateCreditUpdates = (
  initialCredit: number,
  updateRate: number,
  totalMonths: number
): number => {
  // Número de atualizações anuais completas
  const fullYears = Math.floor(totalMonths / 12);
  
  // Valor inicial do crédito
  let updatedCredit = initialCredit;
  
  // Aplica as atualizações anuais
  for (let i = 0; i < fullYears; i++) {
    updatedCredit = updatedCredit * (1 + updateRate / 100);
  }
  
  return updatedCredit;
};

/**
 * Calcula o valor da parcela mensal considerando atualizações anuais
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param currentMonth Mês atual
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @returns Valor da parcela mensal
 */
export const calculateMonthlyInstallment = (
  initialCredit: number,
  totalInstallments: number,
  currentMonth: number,
  updateMonth: number,
  updateRate: number
): number => {
  // Calcula o ano atual baseado no mês
  const currentYear = Math.floor((currentMonth - 1) / 12);
  
  // Calcula o valor do crédito atualizado até o ano atual
  const updatedCredit = calculateCreditUpdates(initialCredit, updateRate, currentYear * 12);
  
  // Calcula o valor base da parcela
  const baseInstallment = updatedCredit / totalInstallments;
  
  // Verifica se o mês atual é um mês de atualização
  const isUpdateMonth = (currentMonth % 12 === updateMonth || (updateMonth === 12 && currentMonth % 12 === 0));
  
  // Se for mês de atualização, aplica a taxa de atualização
  if (isUpdateMonth && currentMonth > 1) {
    return baseInstallment * (1 + updateRate / 100);
  }
  
  return baseInstallment;
};
/**
 *
 Calcula o total pago até o mês de contemplação
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param contemplationMonth Mês de contemplação
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @returns Total pago até o mês de contemplação
 */
export const calculateTotalPaid = (
  initialCredit: number,
  totalInstallments: number,
  contemplationMonth: number,
  updateMonth: number,
  updateRate: number
): number => {
  let totalPaid = 0;
  
  // Soma todas as parcelas pagas até o mês de contemplação
  for (let month = 1; month <= contemplationMonth; month++) {
    const monthlyInstallment = calculateMonthlyInstallment(
      initialCredit,
      totalInstallments,
      month,
      updateMonth,
      updateRate
    );
    totalPaid += monthlyInstallment;
  }
  
  return totalPaid;
};

/**
 * Calcula o saldo devedor considerando taxas e encargos adicionais
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param contemplationMonth Mês de contemplação
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @param adminTaxPct Taxa de administração (em %)
 * @param reserveFundPct Taxa do fundo de reserva (em %)
 * @param insurancePct Taxa de seguro (em %)
 * @returns Saldo devedor
 */
export const calculateRemainingDebt = (
  initialCredit: number,
  totalInstallments: number,
  contemplationMonth: number,
  updateMonth: number,
  updateRate: number,
  adminTaxPct: number = 0,
  reserveFundPct: number = 0,
  insurancePct: number = 0
): number => {
  // Calcula o valor do crédito atualizado até o mês de contemplação
  const updatedCredit = calculateCreditUpdates(
    initialCredit,
    updateRate,
    contemplationMonth
  );
  
  // Calcula o total pago até o mês de contemplação
  const totalPaid = calculateTotalPaid(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate
  );
  
  // Calcula os encargos adicionais
  const adminTax = updatedCredit * (adminTaxPct / 100);
  const reserveFund = updatedCredit * (reserveFundPct / 100);
  const insurance = updatedCredit * (insurancePct / 100);
  
  // Calcula o saldo devedor
  const remainingDebt = updatedCredit + adminTax + reserveFund + insurance - totalPaid;
  
  return Math.max(0, remainingDebt); // Garante que o saldo devedor não seja negativo
};/*
*
 * Calcula a parcela pós-contemplação
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param contemplationMonth Mês de contemplação
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @param adminTaxPct Taxa de administração (em %)
 * @param reserveFundPct Taxa do fundo de reserva (em %)
 * @param insurancePct Taxa de seguro (em %)
 * @returns Valor da parcela pós-contemplação
 */
export const calculatePostContemplationInstallment = (
  initialCredit: number,
  totalInstallments: number,
  contemplationMonth: number,
  updateMonth: number,
  updateRate: number,
  adminTaxPct: number = 0,
  reserveFundPct: number = 0,
  insurancePct: number = 0
): number => {
  // Calcula o saldo devedor
  const remainingDebt = calculateRemainingDebt(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate,
    adminTaxPct,
    reserveFundPct,
    insurancePct
  );
  
  // Calcula o número de parcelas restantes
  const remainingInstallments = totalInstallments - contemplationMonth;
  
  // Se não houver parcelas restantes, retorna 0
  if (remainingInstallments <= 0) {
    return 0;
  }
  
  // Calcula o valor da parcela pós-contemplação
  const postContemplationInstallment = remainingDebt / remainingInstallments;
  
  return postContemplationInstallment;
};

/**
 * Calcula todos os valores relacionados à parcela pós-contemplação
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param contemplationMonth Mês de contemplação
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @param adminTaxPct Taxa de administração (em %)
 * @param reserveFundPct Taxa do fundo de reserva (em %)
 * @param insurancePct Taxa de seguro (em %)
 * @returns Objeto com todos os valores calculados
 */
export const calculateCompletePostContemplation = (
  initialCredit: number,
  totalInstallments: number,
  contemplationMonth: number,
  updateMonth: number,
  updateRate: number,
  adminTaxPct: number = 0,
  reserveFundPct: number = 0,
  insurancePct: number = 0
) => {
  // Valor do crédito atualizado
  const updatedCredit = calculateCreditUpdates(
    initialCredit,
    updateRate,
    contemplationMonth
  );
  
  // Total pago até a contemplação
  const totalPaid = calculateTotalPaid(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate
  );
  
  // Saldo devedor
  const remainingDebt = calculateRemainingDebt(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate,
    adminTaxPct,
    reserveFundPct,
    insurancePct
  );
  
  // Parcelas restantes
  const remainingInstallments = totalInstallments - contemplationMonth;
  
  // Parcela pós-contemplação
  const postContemplationInstallment = calculatePostContemplationInstallment(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate,
    adminTaxPct,
    reserveFundPct,
    insurancePct
  );
  
  return {
    updatedCredit,
    totalPaid,
    remainingDebt,
    remainingInstallments,
    postContemplationInstallment
  };
};