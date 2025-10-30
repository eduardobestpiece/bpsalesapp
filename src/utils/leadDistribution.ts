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

    // 1) Regra de duplicidade: se já existe lead com mesmo email/telefone, manter o mesmo responsável
    const normalizedPhone = (telefone || '').replace(/\D/g, '');
    const normalizedEmail = (email || '').toLowerCase();
    if (normalizedEmail || normalizedPhone) {
      const { data: dupLead } = await supabase
        .from('leads' as any)
        .select('id, responsible_id, email, telefone')
        .eq('company_id', companyId)
        .eq('form_id', formId)
        .order('created_at', { ascending: false })
        .limit(50);
      const found = ((dupLead as any[]) || []).find((l: any) => {
        const e = String(l.email || '').toLowerCase();
        const p = String(l.telefone || '').replace(/\D/g, '');
        return (normalizedEmail && e && e === normalizedEmail) || (normalizedPhone && p && p.endsWith(normalizedPhone));
      });
      if ((found as any)?.responsible_id) {
        const { data: u } = await supabase.from('crm_users' as any).select('first_name, last_name').eq('id', (found as any).responsible_id).single();
        return { responsible_id: (found as any).responsible_id, responsible_name: `${(u as any)?.first_name || ''} ${(u as any)?.last_name || ''}`.trim() || 'Usuário' };
      }
    }

    // 2) Round-robin determinístico baseado em number_weight
    // Carregar distribuição e usuários (apenas peso > 0)
    const { data: distribution } = await supabase
      .from('lead_form_distributions' as any)
      .select('id')
      .eq('lead_form_id', formId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .maybeSingle();
    if (!(distribution as any)?.id) return null;

    const { data: distUsers } = await supabase
      .from('lead_form_distribution_users' as any)
      .select('user_id, number_weight, created_at, crm_users:first_name, crm_users:last_name')
      .eq('distribution_id', (distribution as any).id)
      .gt('number_weight', 0)
      .order('created_at');

    const users = (distUsers || []) as any[];
    if (users.length === 0) return null;

    // Montar sequência repetindo cada user pelo seu number_weight
    const sequence = users.flatMap(u => Array(Math.max(0, Number(u.number_weight) || 0)).fill(u));
    if (sequence.length === 0) return null;

    // Contar quantos leads já foram atribuídos neste formulário para esses usuários
    const userIds = users.map(u => u.user_id);
    const { data: countsData } = await supabase
      .from('leads' as any)
      .select('responsible_id')
      .eq('company_id', companyId)
      .eq('form_id', formId)
      .in('responsible_id', userIds);
    const totalAssigned = (countsData || []).length;

    // Selecionar próximo por índice circular
    const next = sequence[totalAssigned % sequence.length];
    const { data: nextUser } = await supabase
      .from('crm_users')
      .select('first_name, last_name')
      .eq('id', next.user_id)
      .single();
    return {
      responsible_id: next.user_id,
      responsible_name: `${nextUser?.first_name || ''} ${nextUser?.last_name || ''}`.trim() || 'Usuário'
    };

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

