import React from 'react';
import { FullScreenModal, useFullScreenModal } from '../ui/FullScreenModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Save, RefreshCw } from 'lucide-react';

// Exemplo de como usar o FullScreenModal
export const ExampleFullScreenModal = () => {
  const { isOpen, openModal, closeModal } = useFullScreenModal();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    description: ''
  });

  const handleSave = () => {
    // Lógica de salvamento aqui
    closeModal();
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', description: '' });
  };

  return (
    <>
      {/* Botão para abrir o modal */}
      <Button onClick={openModal}>
        Abrir Modal de Exemplo
      </Button>

      {/* Modal em tela cheia */}
      <FullScreenModal
        isOpen={isOpen}
        onClose={closeModal}
        title="Configuração de Exemplo"
        actions={
          <>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw size={16} className="mr-2" />
              Redefinir
            </Button>
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Salvar
            </Button>
          </>
        }
      >
        {/* Conteúdo do modal */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o email"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite uma descrição"
                  className="w-full p-3 border border-border dark:border-[#E50F5E]/30 rounded-md bg-background dark:bg-[#131313] text-foreground dark:text-white resize-none"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-300">
                Aqui você pode adicionar mais configurações conforme necessário.
                O modal se adapta automaticamente ao conteúdo.
              </p>
            </CardContent>
          </Card>
        </div>
      </FullScreenModal>
    </>
  );
};