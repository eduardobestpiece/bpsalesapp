-- Adicionar campo CPF na tabela crm_users
ALTER TABLE public.crm_users 
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.crm_users.cpf IS 'CPF do usuário do CRM';

-- Criar índice para melhorar performance de consultas por CPF
CREATE INDEX IF NOT EXISTS idx_crm_users_cpf ON public.crm_users(cpf); 