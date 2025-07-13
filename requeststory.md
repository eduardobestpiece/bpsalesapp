# Requisição Atual

**Funcionalidade:** Atualização da gestão de Parcelas

**Resumo:**
Atualização concluída conforme checklist: listagem, modal, relação com reduções, duplicação, validação e UX, sem afetar o CRM.

**Checklist:**
- [x] Atualizar componente de listagem de Parcelas (`InstallmentTypesList.tsx`)
- [x] Atualizar modal de criação/edição de Parcelas (`InstallmentTypeModal.tsx`)
- [x] Adicionar campo de redução de parcela (multiseleção, integrando com `installment_reductions` e tabela de relação)
- [x] Adicionar campo de seguro opcional (Sim/Não)
- [x] Adicionar campo de número de parcelas
- [x] Adicionar campo de padrão (apenas uma por administradora)
- [x] Ajustar ações: arquivar/restaurar, duplicar (com restrição)
- [x] Garantir integração com modal de administradora
- [x] Garantir que nada afete o CRM
- [x] Testar e validar

**Status:**
Concluído e pronto para deploy. 