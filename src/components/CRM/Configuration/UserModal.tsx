
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCrmUser, useUpdateCrmUser } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFunnels } from '@/hooks/useFunnels';
// Adiciona a chave pública do Supabase para uso no header apikey
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaG9jZ2hiaWVxeGp3c2RzdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NTQxMTcsImV4cCI6MjA2NzQzMDExN30.L1KLc1360o0uE7kXkD2d3CzMMlztKwAmWheGTmU_ZNc";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export const UserModal = ({ isOpen, onClose, user }: UserModalProps) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'user' as 'master' | 'admin' | 'leader' | 'user',
    funnels: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);

  const { companyId, crmUser } = useCrmAuth();
  const createUserMutation = useCreateCrmUser();
  const updateUserMutation = useUpdateCrmUser();
  const { data: funnels = [] } = useFunnels(companyId);

  // Verificar se o usuário atual pode criar administradores
  const canCreateAdmin = crmUser?.role === 'master' || crmUser?.role === 'admin';

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        funnels: user.funnels || [],
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'user',
        funnels: [],
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!companyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setIsLoading(true);

    try {
      if (user) {
        // Editar usuário existente
        await updateUserMutation.mutateAsync({
          id: user.id,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim(),
          role: formData.role,
          funnels: formData.funnels,
          company_id: companyId,
          status: 'active'
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Chamar API serverless da Vercel para convite de usuário
        const res = await fetch('/api/invite-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            role: formData.role,
            funnels: formData.funnels,
            company_id: companyId
          })
        });
        const data = await res.json();
        if (!res.ok) {
          // Se o erro for um objeto, mostrar a mensagem interna
          let errorMsg = '';
          if (typeof data?.error === 'string') {
            errorMsg = data.error;
          } else if (typeof data?.error === 'object' && data?.error?.message) {
            errorMsg = data.error.message;
          } else {
            errorMsg = JSON.stringify(data?.error || data);
          }
          throw new Error(errorMsg);
        }
        toast.success('Usuário convidado com sucesso! O usuário receberá um e-mail para redefinir a senha.');
      }

      onClose();
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'user', funnels: [] });
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {user && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isLoading || !!user}
            />
            {user && (
              <p className="text-xs text-muted-foreground mt-1">
                O email não pode ser alterado após a criação
              </p>
            )}
          </div>
          {user && (
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                disabled={isLoading}
              />
            </div>
          )}
          <div>
            <Label htmlFor="role">Função *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'admin' | 'user') => setFormData(prev => ({ ...prev, role: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Funis permitidos</Label>
            <div className="flex flex-wrap gap-2">
              {funnels.map((f: any) => (
                <label key={f.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.funnels.includes(f.id)}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        funnels: e.target.checked
                          ? [...prev.funnels, f.id]
                          : prev.funnels.filter((id) => id !== f.id)
                      }));
                    }}
                    disabled={isLoading}
                  />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (user ? 'Atualizar' : 'Convidar Usuário')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
