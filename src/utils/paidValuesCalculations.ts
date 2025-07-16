/**
 * Utilitário para cálculos dos valores pagos
 * Implementa as fórmulas corretas para os cálculos de valores pagos do próprio bolso e pelo inquilino
 */

import { calculateTotalPaid } from './postContemplationCalculations';

/**
 * Calcula o valor pago do próprio bolso considerando as atualizações
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param contemplationMonth Mês de contemplação
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @returns Objeto com o valor pago do próprio bolso e o percentual em relação ao crédito inicial
 */
export const calculatePaidFromOwnPocket = (
  initialCredit: number,
  totalInstallments: number,
  contemplationMonth: number,
  updateMonth: number,
  updateRate: number
): { value: number; percentage: number } => {
  // Calcula o total pago até o mês de contemplação usando a função existente
  const totalPaid = calculateTotalPaid(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate
  );
  
  // Calcula o percentual em relação ao valor do crédito inicial
  const percentage = (totalPaid / initialCredit) * 100;
  
  return {
    value: totalPaid,
    percentage
  };
};

/**
 * Calcula o valor pago pelo inquilino
 * @param initialCredit Valor inicial do crédito
 * @param paidFromOwnPocket Valor pago do próprio bolso
 * @returns Objeto com o valor pago pelo inquilino e o percentual em relação ao crédito inicial
 */
export const calculatePaidByTenant = (
  initialCredit: number,
  paidFromOwnPocket: number
): { value: number; percentage: number } => {
  // Calcula o valor pago pelo inquilino (crédito inicial - pago do próprio bolso)
  const paidByTenant = initialCredit - paidFromOwnPocket;
  
  // Calcula o percentual em relação ao valor do crédito inicial
  const percentage = (paidByTenant / initialCredit) * 100;
  
  return {
    value: paidByTenant,
    percentage
  };
};

/**
 * Calcula todos os valores pagos
 * @param initialCredit Valor inicial do crédito
 * @param totalInstallments Número total de parcelas
 * @param contemplationMonth Mês de contemplação
 * @param updateMonth Mês de atualização (1-12)
 * @param updateRate Taxa de atualização anual (em %)
 * @returns Objeto com todos os valores calculados
 */
export const calculateCompletePaidValues = (
  initialCredit: number,
  totalInstallments: number,
  contemplationMonth: number,
  updateMonth: number,
  updateRate: number
) => {
  // Calcula o valor pago do próprio bolso
  const paidFromOwnPocket = calculatePaidFromOwnPocket(
    initialCredit,
    totalInstallments,
    contemplationMonth,
    updateMonth,
    updateRate
  );
  
  // Calcula o valor pago pelo inquilino
  const paidByTenant = calculatePaidByTenant(
    initialCredit,
    paidFromOwnPocket.value
  );
  
  return {
    paidFromOwnPocket,
    paidByTenant
  };
};