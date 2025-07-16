/**
 * Utilitário para cálculos de fluxo de caixa
 * Implementa as fórmulas corretas para os cálculos de fluxo de caixa antes e após 240 meses
 */

import { calculateCompleteMonthlyGains } from './monthlyGainsCalculations';

/**
 * Calcula o fluxo de caixa antes de 240 meses
 * @param monthlyGains Ganhos mensais
 * @param postContemplationInstallment Parcela pós-contemplação
 * @returns Fluxo de caixa antes de 240 meses
 */
export const calculateCashFlowBefore240 = (
  monthlyGains: number,
  postContemplationInstallment: number
): number => {
  // Fórmula: Ganhos Mensais - Parcela Pós-Contemplação
  return monthlyGains - postContemplationInstallment;
};

/**
 * Calcula o fluxo de caixa após 240 meses
 * @param propertyValue Valor atualizado do imóvel
 * @param dailyPercentage Percentual da diária (em %)
 * @param occupancyRate Taxa de ocupação (em %)
 * @param adminPercentage Percentual da administradora (em %)
 * @param expensesPercentage Percentual das despesas totais (em %)
 * @returns Fluxo de caixa após 240 meses
 */
export const calculateCashFlowAfter240 = (
  propertyValue: number,
  dailyPercentage: number,
  occupancyRate: number,
  adminPercentage: number,
  expensesPercentage: number
): number => {
  // Usa a mesma fórmula dos ganhos mensais, mas com o valor atualizado do imóvel
  const { monthlyGains } = calculateCompleteMonthlyGains(
    propertyValue,
    dailyPercentage,
    occupancyRate,
    adminPercentage,
    expensesPercentage
  );
  
  // Após 240 meses, não há mais parcela pós-contemplação
  return monthlyGains;
};

/**
 * Calcula o valor atualizado do imóvel após 240 meses
 * @param initialPropertyValue Valor inicial do imóvel
 * @param annualAppreciationRate Taxa de valorização anual do imóvel (em %)
 * @returns Valor atualizado do imóvel
 */
export const calculateUpdatedPropertyValue = (
  initialPropertyValue: number,
  annualAppreciationRate: number
): number => {
  // Número de anos em 240 meses
  const years = 240 / 12;
  
  // Calcula o valor atualizado do imóvel
  const updatedPropertyValue = initialPropertyValue * Math.pow(1 + annualAppreciationRate / 100, years);
  
  return updatedPropertyValue;
};

/**
 * Calcula o fluxo de caixa completo
 * @param propertyValue Valor inicial do imóvel
 * @param dailyPercentage Percentual da diária (em %)
 * @param occupancyRate Taxa de ocupação (em %)
 * @param adminPercentage Percentual da administradora (em %)
 * @param expensesPercentage Percentual das despesas totais (em %)
 * @param postContemplationInstallment Parcela pós-contemplação
 * @param annualAppreciationRate Taxa de valorização anual do imóvel (em %)
 * @returns Objeto com os valores de fluxo de caixa antes e após 240 meses
 */
export const calculateCompleteCashFlow = (
  propertyValue: number,
  dailyPercentage: number,
  occupancyRate: number,
  adminPercentage: number,
  expensesPercentage: number,
  postContemplationInstallment: number,
  annualAppreciationRate: number
) => {
  // Calcula os ganhos mensais
  const { monthlyGains } = calculateCompleteMonthlyGains(
    propertyValue,
    dailyPercentage,
    occupancyRate,
    adminPercentage,
    expensesPercentage
  );
  
  // Calcula o fluxo de caixa antes de 240 meses
  const cashFlowBefore240 = calculateCashFlowBefore240(
    monthlyGains,
    postContemplationInstallment
  );
  
  // Calcula o valor atualizado do imóvel após 240 meses
  const updatedPropertyValue = calculateUpdatedPropertyValue(
    propertyValue,
    annualAppreciationRate
  );
  
  // Calcula o fluxo de caixa após 240 meses
  const cashFlowAfter240 = calculateCashFlowAfter240(
    updatedPropertyValue,
    dailyPercentage,
    occupancyRate,
    adminPercentage,
    expensesPercentage
  );
  
  return {
    monthlyGains,
    postContemplationInstallment,
    cashFlowBefore240,
    updatedPropertyValue,
    cashFlowAfter240
  };
};