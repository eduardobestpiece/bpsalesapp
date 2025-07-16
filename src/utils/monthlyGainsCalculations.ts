/**
 * Utilitário para cálculos de ganhos mensais
 * Implementa as fórmulas corretas para os cálculos de ganhos mensais
 */

/**
 * Calcula o valor da diária
 * @param propertyValue Valor do imóvel
 * @param dailyPercentage Percentual da diária (em %)
 * @returns Valor da diária em reais
 */
export const calculateDailyValue = (propertyValue: number, dailyPercentage: number): number => {
  // Fórmula: Valor do imóvel * Percentual da diária
  return propertyValue * (dailyPercentage / 100);
};

/**
 * Calcula a ocupação em dias
 * @param occupancyRate Taxa de ocupação (em %)
 * @returns Número de dias ocupados em um mês
 */
export const calculateOccupancyDays = (occupancyRate: number): number => {
  // Fórmula: 30 dias * Taxa de ocupação
  return 30 * (occupancyRate / 100);
};

/**
 * Calcula o valor mensal
 * @param dailyValue Valor da diária
 * @param occupancyDays Dias de ocupação
 * @returns Valor mensal em reais
 */
export const calculateMonthlyValue = (dailyValue: number, occupancyDays: number): number => {
  // Fórmula: Valor da diária * Ocupação
  return dailyValue * occupancyDays;
};

/**
 * Calcula a taxa do Airbnb
 * @param monthlyValue Valor mensal
 * @param adminPercentage Percentual da administradora (em %)
 * @returns Valor da taxa do Airbnb em reais
 */
export const calculateAirbnbFee = (monthlyValue: number, adminPercentage: number): number => {
  // Fórmula: Valor mensal * Percentual da administradora
  return monthlyValue * (adminPercentage / 100);
};

/**
 * Calcula os custos do imóvel
 * @param propertyValue Valor do imóvel
 * @param expensesPercentage Percentual das despesas totais (em %)
 * @returns Valor dos custos do imóvel em reais
 */
export const calculatePropertyCosts = (propertyValue: number, expensesPercentage: number): number => {
  // Fórmula: Valor do imóvel * Percentual das despesas totais
  return propertyValue * (expensesPercentage / 100);
};

/**
 * Calcula os custos totais
 * @param airbnbFee Taxa do Airbnb
 * @param propertyCosts Custos do imóvel
 * @returns Valor dos custos totais em reais
 */
export const calculateTotalCosts = (airbnbFee: number, propertyCosts: number): number => {
  // Fórmula: Taxa do Airbnb + Custos do imóvel
  return airbnbFee + propertyCosts;
};

/**
 * Calcula os ganhos mensais
 * @param monthlyValue Valor mensal
 * @param totalCosts Custos totais
 * @returns Valor dos ganhos mensais em reais
 */
export const calculateMonthlyGains = (monthlyValue: number, totalCosts: number): number => {
  // Fórmula: Valor mensal - Custos totais
  return monthlyValue - totalCosts;
};

/**
 * Calcula os ganhos mensais completos a partir dos dados básicos
 * @param propertyValue Valor do imóvel
 * @param dailyPercentage Percentual da diária (em %)
 * @param occupancyRate Taxa de ocupação (em %)
 * @param adminPercentage Percentual da administradora (em %)
 * @param expensesPercentage Percentual das despesas totais (em %)
 * @returns Objeto com todos os valores calculados
 */
export const calculateCompleteMonthlyGains = (
  propertyValue: number,
  dailyPercentage: number,
  occupancyRate: number,
  adminPercentage: number,
  expensesPercentage: number
) => {
  // Valor da diária
  const dailyValue = calculateDailyValue(propertyValue, dailyPercentage);
  
  // Ocupação
  const occupancyDays = calculateOccupancyDays(occupancyRate);
  
  // Valor mensal
  const monthlyValue = calculateMonthlyValue(dailyValue, occupancyDays);
  
  // Taxa do Airbnb
  const airbnbFee = calculateAirbnbFee(monthlyValue, adminPercentage);
  
  // Custos do imóvel
  const propertyCosts = calculatePropertyCosts(propertyValue, expensesPercentage);
  
  // Custos totais
  const totalCosts = calculateTotalCosts(airbnbFee, propertyCosts);
  
  // Ganhos mensais
  const monthlyGains = calculateMonthlyGains(monthlyValue, totalCosts);
  
  return {
    dailyValue,
    occupancyDays,
    monthlyValue,
    airbnbFee,
    propertyCosts,
    totalCosts,
    monthlyGains
  };
};