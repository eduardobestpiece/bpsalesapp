import { useSimulator } from '@/contexts/SimulatorContext';
import { 
  calculateCompletePostContemplation,
  calculateCreditUpdates,
  calculateRemainingDebt,
  calculatePostContemplationInstallment
} from '@/utils/postContemplationCalculations';

/**
 * Hook personalizado para cálculos da parcela pós-contemplação
 * Utiliza os dados do contexto do simulador para realizar os cálculos
 */
export const usePostContemplationCalculations = () => {
  const {
    administrator,
    product,
    contemplationMonth,
    simulationData
  } = useSimulator();

  /**
   * Calcula o valor do crédito atualizado até o mês de contemplação
   * @returns Valor do crédito atualizado
   */
  const getUpdatedCredit = (): number => {
    return calculateCreditUpdates(
      product.nominalCreditValue,
      administrator.updateIndex === 'INCC' ? 8 : 6, // Taxa de atualização (INCC = 8%, IPCA = 6%)
      contemplationMonth
    );
  };

  /**
   * Calcula o saldo devedor considerando taxas e encargos adicionais
   * @returns Saldo devedor
   */
  const getRemainingDebt = (): number => {
    return calculateRemainingDebt(
      product.nominalCreditValue,
      product.termMonths,
      contemplationMonth,
      administrator.updateMonth,
      administrator.updateIndex === 'INCC' ? 8 : 6, // Taxa de atualização (INCC = 8%, IPCA = 6%)
      product.adminTaxPct,
      product.reserveFundPct,
      product.insurancePct
    );
  };

  /**
   * Calcula a parcela pós-contemplação
   * @returns Valor da parcela pós-contemplação
   */
  const getPostContemplationInstallment = (): number => {
    return calculatePostContemplationInstallment(
      product.nominalCreditValue,
      product.termMonths,
      contemplationMonth,
      administrator.updateMonth,
      administrator.updateIndex === 'INCC' ? 8 : 6, // Taxa de atualização (INCC = 8%, IPCA = 6%)
      product.adminTaxPct,
      product.reserveFundPct,
      product.insurancePct
    );
  };

  /**
   * Calcula todos os valores relacionados à parcela pós-contemplação
   * @returns Objeto com todos os valores calculados
   */
  const getCompletePostContemplation = () => {
    return calculateCompletePostContemplation(
      product.nominalCreditValue,
      product.termMonths,
      contemplationMonth,
      administrator.updateMonth,
      administrator.updateIndex === 'INCC' ? 8 : 6, // Taxa de atualização (INCC = 8%, IPCA = 6%)
      product.adminTaxPct,
      product.reserveFundPct,
      product.insurancePct
    );
  };

  return {
    getUpdatedCredit,
    getRemainingDebt,
    getPostContemplationInstallment,
    getCompletePostContemplation
  };
};