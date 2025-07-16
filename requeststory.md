# Requisição Atual

**Funcionalidade:** Correções finais de Dark Mode e Ajustes Visuais

**Resumo:**
Resolver problemas específicos de dark mode em várias páginas e componentes, além de implementar ajustes visuais e funcionais solicitados.

## Problemas identificados com Dark Mode:

### Páginas com fundo branco no dark mode:
- [x] Página de configurações do CRM
- [x] Página Master Config 
- [x] Página do simulador
- [x] Campo do valor do imóvel (fonte clara e fundo claro)

### Problemas de contraste:
- [x] Linha do "Exemplo de contemplação" muito escura no darkmode
- [x] Lista na página de Alavancas com informações escuras e fundo escuro

### Ajustes de texto:
- [x] Remover caixa alta dos botões "Alavancagem Simples", "Alavancagem Escalonada"

### Logo específica:
- [x] Logo da página de login no darkmode deve ser "/Users/eduardocosta/Downloads/Projeto Monteo/dist/Logo Monteo.png"

## Ajustes funcionais:

### Master Config:
- [x] Página "Master Config" no módulo simulação deve levar para página igual a "crm/master"
- [x] Criar rota "simulador/master" com mesma funcionalidade
- [x] Sincronizar alterações entre as duas páginas

### Cores da plataforma:
- [x] Linha da "Evolução Patrimonial" deve ser no marrom da plataforma
- [x] Informações "Dados da Alavancagem Única" devem ser no marrom da plataforma (com possível degradê)

**Status:** Concluído e validado
# Requisiçã
o Atual

**Funcionalidade:** Melhorias na Exibição de Valores

**Resumo:**
Implementar melhorias na exibição de valores no simulador, incluindo a correção da exibição do item "Despesas" e a limitação da taxa anual a duas casas decimais.

## Tarefas:

### Correção da exibição do item "Despesas":
- [x] Implementar lógica para exibir como valor em reais quando "Imóvel tem valor fixo" é verdadeiro
- [x] Implementar lógica para exibir como percentual quando "Imóvel tem valor fixo" é falso
- [x] Aplicar em LeverageConfiguration.tsx e PatrimonialLeverageNew.tsx

### Limitação da taxa anual:
- [x] Implementar formatação para garantir sempre até duas casas decimais
- [x] Aplicar em CreditAccessPanel.tsx

**Status:** Concluído e validado