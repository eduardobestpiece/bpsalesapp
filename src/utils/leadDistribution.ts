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
    const { data: distribution, error: distError } = await supabase
      .from('lead_form_distributions' as any)
      .select('id')
      .eq('lead_form_id', formId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (distError) {
      console.error('❌ Erro ao buscar distribuição:', distError);
      return null;
    }
    
    if (!(distribution as any)?.id) {
      console.log('ℹ️ Nenhuma distribuição ativa encontrada');
      return null;
    }

    const distributionId = (distribution as any).id;
    console.log('✅ Distribuição encontrada:', distributionId);

    const { data: distUsers, error: usersError } = await supabase
      .from('lead_form_distribution_users' as any)
      .select('user_id, number_weight, created_at')
      .eq('distribution_id', distributionId)
      .gt('number_weight', 0)
      .order('created_at');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários da distribuição:', usersError);
      return null;
    }

    const users = (distUsers || []) as any[];
    console.log('👥 Usuários na distribuição:', users.length, users.map(u => ({ user_id: u.user_id, weight: u.number_weight })));
    
    if (users.length === 0) {
      console.log('ℹ️ Nenhum usuário com peso > 0 na distribuição');
      return null;
    }

    // Montar sequência repetindo cada user pelo seu number_weight
    const sequence: any[] = [];
    users.forEach(u => {
      const weight = Math.max(0, Number(u.number_weight) || 0);
      for (let i = 0; i < weight; i++) {
        sequence.push(u);
      }
    });
    
    console.log('🔄 Sequência gerada:', sequence.length, 'posições');
    
    if (sequence.length === 0) {
      console.log('ℹ️ Sequência vazia (todos os pesos são 0)');
      return null;
    }

    // Contar quantos leads já foram atribuídos neste formulário para esses usuários
    const userIds = users.map(u => u.user_id);
    const { data: countsData, error: countsError } = await supabase
      .from('leads' as any)
      .select('responsible_id')
      .eq('company_id', companyId)
      .eq('form_id', formId)
      .in('responsible_id', userIds);

    if (countsError) {
      console.error('❌ Erro ao contar leads atribuídos:', countsError);
      // Continua mesmo com erro, usando índice 0
    }

    const totalAssigned = (countsData || []).length;
    console.log('📊 Total de leads já atribuídos:', totalAssigned);

    // Selecionar próximo por índice circular
    const nextIndex = totalAssigned % sequence.length;
    const next = sequence[nextIndex];
    console.log('🎯 Próximo índice:', nextIndex, 'usuário:', next.user_id);

    if (!next || !next.user_id) {
      console.error('❌ Erro: usuário não encontrado na sequência');
      return null;
    }

    const { data: nextUser, error: userError } = await supabase
      .from('crm_users' as any)
      .select('first_name, last_name')
      .eq('id', next.user_id)
      .single();

    if (userError || !nextUser) {
      console.error('❌ Erro ao buscar dados do usuário:', userError);
      return {
        responsible_id: next.user_id,
        responsible_name: 'Usuário'
      };
    }

    const result = {
      responsible_id: next.user_id,
      responsible_name: `${(nextUser as any)?.first_name || ''} ${(nextUser as any)?.last_name || ''}`.trim() || 'Usuário'
    };

    console.log('✅ Distribuição concluída:', result);
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

