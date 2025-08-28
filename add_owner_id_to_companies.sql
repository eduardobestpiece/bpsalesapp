-- Adicionar campo owner_id na tabela companies
ALTER TABLE companies 
ADD COLUMN owner_id UUID REFERENCES crm_users(id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN companies.owner_id IS 'ID do usuário proprietário da empresa. Quando definido, o usuário terá acesso total a todos os recursos da empresa.';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies' AND column_name = 'owner_id'; 