# Guia de Migração para FullScreenModal

Este guia explica como migrar os modais existentes da plataforma para o novo padrão FullScreenModal, inspirado no Google Tag Manager.

## Características do Novo Padrão

### ✨ **Recursos Principais:**
- **Tela cheia** com overlay
- **Animação slide da direita para esquerda**
- **Header fixo** com título e botões de ação
- **Cores da plataforma** (mantém tema claro/escuro)
- **Responsivo** e acessível

### 🎨 **Design System:**
- Header com fundo `bg-card dark:bg-[#1F1F1F]`
- Conteúdo com fundo `bg-background dark:bg-[#131313]`
- Bordas com `border-border dark:border-[#A86F57]/20`
- Botões seguem padrão da plataforma

## Como Migrar um Modal Existente

### **Antes (Modal Tradicional):**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MyModal = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meu Modal</DialogTitle>
        </DialogHeader>
        <div>Conteúdo aqui</div>
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### **Depois (FullScreenModal):**
```tsx
import { FullScreenModal } from '@/components/ui/FullScreenModal';

const MyModal = ({ open, onClose }) => {
  return (
    <FullScreenModal
      isOpen={open}
      onClose={onClose}
      title="Meu Modal"
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </>
      }
    >
      <div>Conteúdo aqui</div>
    </FullScreenModal>
  );
};
```

## Exemplos de Uso

### **1. Modal Simples:**
```tsx
<FullScreenModal
  isOpen={isOpen}
  onClose={closeModal}
  title="Configurações"
  actions={<Button onClick={handleSave}>Salvar</Button>}
>
  <div>Conteúdo do modal</div>
</FullScreenModal>
```

### **2. Modal com Múltiplas Ações:**
```tsx
<FullScreenModal
  isOpen={isOpen}
  onClose={closeModal}
  title="Editar Produto"
  actions={
    <>
      <Button variant="outline" onClick={handleReset}>
        Redefinir
      </Button>
      <Button variant="secondary" onClick={handlePreview}>
        Visualizar
      </Button>
      <Button onClick={handleSave}>
        Salvar
      </Button>
    </>
  }
>
  <ProductForm />
</FullScreenModal>
```

### **3. Modal com Switch/Toggle no Header:**
```tsx
<FullScreenModal
  isOpen={isOpen}
  onClose={closeModal}
  title="Configurações Avançadas"
  actions={
    <>
      <div className="flex items-center gap-2 mr-4">
        <span className="text-xs text-muted-foreground">Básico</span>
        <Switch checked={isAdvanced} onCheckedChange={setIsAdvanced} />
        <span className="text-xs text-muted-foreground">Avançado</span>
      </div>
      <Button onClick={handleSave}>Salvar</Button>
    </>
  }
>
  {isAdvanced ? <AdvancedSettings /> : <BasicSettings />}
</FullScreenModal>
```

## Hook Utilitário

Use o hook `useFullScreenModal` para controlar o estado:

```tsx
import { useFullScreenModal } from '@/components/ui/FullScreenModal';

const MyComponent = () => {
  const { isOpen, openModal, closeModal, toggleModal } = useFullScreenModal();
  
  return (
    <>
      <Button onClick={openModal}>Abrir Modal</Button>
      <FullScreenModal isOpen={isOpen} onClose={closeModal} title="Título">
        Conteúdo
      </FullScreenModal>
    </>
  );
};
```

## Modais a Migrar na Plataforma

### **Simulador:**
- ✅ `SimulatorConfigModal` - **MIGRADO**
- ⏳ Outros modais do simulador

### **CRM:**
- ⏳ Modal de criação/edição de indicadores
- ⏳ Modal de configuração de funis
- ⏳ Modal de times
- ⏳ Modal de usuários

### **Configurações:**
- ⏳ Modal de administradoras
- ⏳ Modal de produtos
- ⏳ Modal de parcelas
- ⏳ Modal de reduções

## Benefícios da Migração

### **UX Melhorada:**
- ✅ Mais espaço para conteúdo
- ✅ Navegação intuitiva
- ✅ Animações suaves
- ✅ Padrão consistente

### **Desenvolvimento:**
- ✅ Componente reutilizável
- ✅ Props padronizadas
- ✅ Fácil manutenção
- ✅ Tema automático

### **Acessibilidade:**
- ✅ Escape para fechar
- ✅ Overlay clicável
- ✅ Foco gerenciado
- ✅ Responsivo

## Próximos Passos

1. **Testar** o modal de configurações do simulador
2. **Migrar** outros modais gradualmente
3. **Padronizar** todas as interfaces
4. **Documentar** padrões específicos por seção

---

**Resultado:** Interface mais profissional, consistente e moderna em toda a plataforma! 🚀