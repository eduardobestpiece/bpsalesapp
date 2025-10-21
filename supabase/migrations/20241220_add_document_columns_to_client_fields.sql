-- Adicionar colunas para configurações de documento
ALTER TABLE client_fields 
ADD COLUMN document_cpf BOOLEAN DEFAULT FALSE,
ADD COLUMN document_cnpj BOOLEAN DEFAULT FALSE;

-- Adicionar constraint para garantir que apenas um tipo de documento seja selecionado
ALTER TABLE client_fields 
ADD CONSTRAINT check_document_type 
CHECK (
  (document_cpf = FALSE AND document_cnpj = FALSE) OR 
  (document_cpf = TRUE AND document_cnpj = FALSE) OR 
  (document_cpf = FALSE AND document_cnpj = TRUE)
);
