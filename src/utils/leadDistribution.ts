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
 * @param email Email do lead (opcional, para verificação de duplicatas)
 * @param telefone Telefone do lead (opcional, para verificação de duplicatas)
 * @returns Objeto com responsible_id e responsible_name, ou null se não houver distribuição configurada
 */
export async function distributeLead(
  formId: string, 
  companyId: string, 
  email?: string, 
  telefone?: string
): Promise<DistributionResult | null> {
  try {
    console.log('🎯 Iniciando distribuição para formId:', formId, 'companyId:', companyId);
    console.log('📧 Email para verificação:', email);
    console.log('📱 Telefone para verificação:', telefone);

    // Usar a função SQL diretamente via RPC (incluindo verificação de duplicatas)
    const { data: assignedUserId, error: assignError } = await supabase
      .rpc('assign_lead_responsible' as any, {
        p_form_id: formId,
        p_company_id: companyId,
        p_email: email || null,
        p_telefone: telefone || null
      });

    if (assignError) {
      console.log('❌ Erro ao atribuir responsável:', assignError);
      return null;
    }

    if (!assignedUserId || typeof assignedUserId !== 'string') {
      console.log('ℹ️ Nenhum responsável atribuído (sem distribuição configurada)');
      return null;
    }

    console.log('✅ Responsável atribuído:', assignedUserId);

    // Buscar dados do usuário responsável
    const { data: userData, error: userError } = await supabase
      .from('crm_users')
      .select('id, first_name, last_name, email, phone')
      .eq('id', assignedUserId)
      .single();

    if (userError || !userData) {
      console.log('❌ Erro ao buscar dados do usuário:', userError);
      return {
        responsible_id: assignedUserId,
        responsible_name: 'Usuário'
      };
    }

    const result = {
      responsible_id: assignedUserId,
      responsible_name: `${userData.first_name} ${userData.last_name}`.trim()
    };

    console.log('🎯 Distribuição concluída:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro na distribuição automática de leads:', error);
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
      .from('lead_form_distributions' as any)
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

