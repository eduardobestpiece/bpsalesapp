
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateCrmUser } from '@/hooks/useCrmUsers';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFunnels } from '@/hooks/useFunnels';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const { companyId, crmUser } = useCrmAuth();
  const updateUserMutation = useUpdateCrmUser();
  // Buscar empresas
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
  // Funis filtrados pela empresa selecionada
  const { data: funnels = [] } = useFunnels(selectedCompanyId || companyId);

  // Verificar se o usuário atual pode criar administradores
  const canCreateAdmin = crmUser?.role === 'master' || crmUser?.role === 'admin';
  const canCreateSubMaster = crmUser?.role === 'master';

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

  // Corrigir envio do campo funnels para garantir array de strings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    const finalCompanyId = selectedCompanyId || companyId;
    if (!finalCompanyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setIsLoading(true);

    try {
      const funisArray = Array.isArray(formData.funnels) ? formData.funnels : (typeof formData.funnels === 'string' ? [formData.funnels] : []);
      if (user) {
        // Editar usuário existente
        await updateUserMutation.mutateAsync({
          id: user.id,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim(),
          role: formData.role,
          funnels: funisArray,
          company_id: finalCompanyId,
          status: 'active'
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Chamar Edge Function do Supabase para convite de usuário

        const { data, error } = await supabase.functions.invoke('invite-user', {
          body: {
            email: formData.email.trim(),
            role: formData.role,
            funnels: funisArray,
            company_id: finalCompanyId
          }
        });


        if (error) {
          
          // Tentar extrair mais detalhes do erro
          let errorMessage = 'Erro ao convidar usuário';
          
          if (error.message) {
            errorMessage = error.message;
          }
          
          // Se for um erro de função Edge, tentar obter mais detalhes
          if (error.message?.includes('Edge Function')) {
            errorMessage = 'Erro interno no servidor. Verifique se todos os dados estão corretos.';
          }
          
          throw new Error(errorMessage);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (!data?.success) {
          throw new Error('Falha ao processar convite do usuário');
        }

        toast.success(data?.message || 'Usuário convidado com sucesso! O usuário receberá um e-mail para redefinir a senha.');
      }

      onClose();
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'user', funnels: [] });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Editar Usuário' : 'Novo Usuário'}
      actions={<Button type="submit" form="user-form" variant="brandPrimaryToSecondary" className="brand-radius">{isLoading ? 'Salvando...' : (user ? 'Atualizar' : 'Convidar')}</Button>}
    >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de empresa */}
          {crmUser?.role === 'master' && (
            <div>
              <Label htmlFor="company_id">Empresa *</Label>
              <Select
                value={selectedCompanyId || companyId || ''}
                onValueChange={(value) => setSelectedCompanyId(value)}
                disabled={isLoading || companiesLoading}
                required
              >
                <SelectTrigger className="select-trigger-brand brand-radius">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companiesLoading ? (
                    <div className="px-4 py-2 text-muted-foreground text-sm">Carregando empresas...</div>
                  ) : companies.length > 0 ? (
                    companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="dropdown-item-brand">{c.name}</SelectItem>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-muted-foreground text-sm">Nenhuma empresa encontrada</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
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
                  className="campo-brand brand-radius"
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
                  className="campo-brand brand-radius"
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
              className="campo-brand brand-radius"
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
                className="campo-brand brand-radius"
              />
            </div>
          )}
          {/* Seleção de papel */}
          <div>
            <Label htmlFor="role">Papel *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value as any }))}
              disabled={isLoading}
              required
            >
              <SelectTrigger className="select-trigger-brand brand-radius">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user" className="dropdown-item-brand">Usuário</SelectItem>
                {canCreateAdmin && <SelectItem value="admin" className="dropdown-item-brand">Administrador</SelectItem>}
                {canCreateSubMaster && <SelectItem value="submaster" className="dropdown-item-brand">SubMaster (visualização total, sem edição)</SelectItem>}
                {crmUser?.role === 'master' && <SelectItem value="master" className="dropdown-item-brand">Master</SelectItem>}
                {/* Remover opção de líder do modal de usuário */}
              </SelectContent>
            </Select>
          </div>
          {/* Seleção de funis - visível para master, admin e líder */}
          {(crmUser?.role === 'master' || crmUser?.role === 'admin' || crmUser?.role === 'leader') && (
            <div>
              <Label htmlFor="funnels">Funis *</Label>
              <Select
                value={formData.funnels.join(',')}
                onValueChange={(value) => setFormData(prev => ({ ...prev, funnels: value.split(',').filter(Boolean) }))}
                disabled={isLoading}
                required
              >
                <SelectTrigger className="select-trigger-brand brand-radius">
                  <SelectValue placeholder="Selecione os funis" />
                </SelectTrigger>
                <SelectContent>
                  {funnels.length > 0 ? (
                    funnels.map((f: any) => (
                      <SelectItem key={f.id} value={f.id} className="dropdown-item-brand">{f.name}</SelectItem>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-muted-foreground text-sm">Nenhum funil encontrado</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4"></div>
        </form>
    </FullScreenModal>
  );
};
