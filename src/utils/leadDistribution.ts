import { supabase } from '@/integrations/supabase/client';

// Interface para usuário da distribuição
interface DistributionUser {
  id: string;
  user_id: string;
  user_name: string;
  number_weight: number;
  percentage_weight: number;
}

// Interface para resultado da distribuição
interface DistributionResult {
  responsible_id: string;
  responsible_name: string;
}

/**
 * Distribui um lead automaticamente baseado na configuração do formulário
 * @param formId ID do formulário
 * @param companyId ID da empresa
 * @returns Objeto com responsible_id e responsible_name, ou null se não houver distribuição configurada
 */
export async function distributeLead(formId: string, companyId: string): Promise<DistributionResult | null> {
  try {
    // Buscar configuração de distribuição ativa
    const { data: distribution, error: distError } = await supabase
      .from('lead_form_distributions')
      .select('id, is_active')
      .eq('lead_form_id', formId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    if (distError || !distribution) {
      // Não há distribuição configurada ou não está ativa
      return null;
    }

    // Buscar usuários da distribuição
    const { data: distUsers, error: usersError } = await supabase
      .from('lead_form_distribution_users')
      .select(`
        user_id,
        user_name: crm_users.name,
        number_weight,
        percentage_weight
      `)
      .eq('distribution_id', distribution.id)
      .order('created_at');

    if (usersError || !distUsers || distUsers.length === 0) {
      // Não há usuários na distribuição
      return null;
    }

    // Algoritmo de distribuição baseado em peso
    const totalWeight = distUsers.reduce((sum, user) => sum + user.number_weight, 0);
    
    if (totalWeight === 0) {
      // Se todos os pesos são 0, distribuir igualmente
      const randomIndex = Math.floor(Math.random() * distUsers.length);
      return {
        responsible_id: distUsers[randomIndex].user_id,
        responsible_name: distUsers[randomIndex].user_name
      };
    }

    // Gerar número aleatório entre 1 e totalWeight
    const randomNumber = Math.floor(Math.random() * totalWeight) + 1;
    
    // Encontrar usuário responsável baseado no peso
    let currentWeight = 0;
    for (const user of distUsers) {
      currentWeight += user.number_weight;
      if (randomNumber <= currentWeight) {
        return {
          responsible_id: user.user_id,
          responsible_name: user.user_name
        };
      }
    }

    // Fallback: retornar o primeiro usuário
    return {
      responsible_id: distUsers[0].user_id,
      responsible_name: distUsers[0].user_name
    };

  } catch (error) {
    console.error('Erro na distribuição automática de leads:', error);
    return null;
  }
}

/**
 * Verifica se um formulário tem distribuição configurada e ativa
 * @param formId ID do formulário
 * @param companyId ID da empresa
 * @returns true se tem distribuição ativa, false caso contrário
 */
export async function hasActiveDistribution(formId: string, companyId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('lead_form_distributions')
      .select('id')
      .eq('lead_form_id', formId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Erro ao verificar distribuição:', error);
    return false;
  }
}
