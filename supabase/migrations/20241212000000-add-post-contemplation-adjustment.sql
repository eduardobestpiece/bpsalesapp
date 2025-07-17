-- Adicionar campo de ajuste pós contemplação na tabela administrators
ALTER TABLE administrators ADD COLUMN post_contemplation_adjustment DECIMAL(5,2) DEFAULT 0.00; 