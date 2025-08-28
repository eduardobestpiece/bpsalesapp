-- Definir o master eduardocosta@bestpiece.com.br como proprietário da Best Piece
-- Empresa: Best Piece (ID: 334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b)
-- Usuário: eduardocosta@bestpiece.com.br (ID: d0390379-4c55-4838-a659-b76e595486a6)

UPDATE companies 
SET owner_id = 'd0390379-4c55-4838-a659-b76e595486a6'
WHERE id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b';

-- Verificar se a atualização foi realizada
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  u.email as owner_email,
  u.first_name as owner_first_name,
  u.last_name as owner_last_name,
  u.role as owner_role
FROM companies c
LEFT JOIN crm_users u ON c.owner_id = u.id
WHERE c.id = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b'; 