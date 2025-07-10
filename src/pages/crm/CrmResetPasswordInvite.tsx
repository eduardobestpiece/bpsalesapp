
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CrmResetPasswordInvite = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthdate: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há parâmetros de convite na URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    console.log('URL params:', { token, type });
    
    if (token && type === 'invite') {
      // Verificar o token de convite
      supabase.auth.verifyOtp({
        token_hash: token,
        type: 'invite'
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error verifying invite token:', error);
          setError('Link de convite inválido ou expirado. Entre em contato com o administrador.');
        } else {
          console.log('Invite token verified:', data);
          if (data.user?.email) {
            setForm(prev => ({ ...prev, email: data.user.email || '' }));
          }
        }
      });
    } else {
      // Se não há token de convite, mostrar erro
      // setError('Link de convite inválido. Entre em contato com o administrador.'); // Removido para não mostrar erro ao abrir a página sem token
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      // Atualizar a senha e dados do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          birthdate: form.birthdate
        }
      });

      if (updateError) {
        console.error('Error updating user:', updateError);
        setError('Erro ao completar cadastro: ' + updateError.message);
        setIsLoading(false);
        return;
      }

      // Buscar e atualizar o usuário CRM
      const { data: crmUser, error: crmUserError } = await supabase
        .from('crm_users')
        .select('*')
        .eq('email', form.email)
        .single();

      if (crmUserError) {
        console.error('Error fetching CRM user:', crmUserError);
        setError('Erro ao buscar dados do usuário.');
        setIsLoading(false);
        return;
      }

      // Atualizar dados do usuário CRM
      const { error: updateCrmError } = await supabase
        .from('crm_users')
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          birth_date: form.birthdate
        })
        .eq('id', crmUser.id);

      if (updateCrmError) {
        console.error('Error updating CRM user:', updateCrmError);
        setError('Erro ao atualizar dados do usuário.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Cadastro completado com sucesso! Redirecionando para o login...');
      setTimeout(() => navigate('/crm/login'), 2000);
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao completar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete seu cadastro</CardTitle>
            <CardDescription>
              Preencha seus dados e defina uma senha para acessar a plataforma.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>Cadastro completado com sucesso!</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input 
                  id="first_name" 
                  name="first_name" 
                  value={form.first_name} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  placeholder="Seu nome" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input 
                  id="last_name" 
                  name="last_name" 
                  value={form.last_name} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  placeholder="Seu sobrenome" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="Seu e-mail" 
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  placeholder="(11) 99999-9999" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Data de nascimento</Label>
                <Input 
                  id="birthdate" 
                  name="birthdate" 
                  type="date" 
                  value={form.birthdate} 
                  onChange={handleChange} 
                  disabled={isLoading} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  placeholder="Mínimo 6 caracteres" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                  placeholder="Repita a senha" 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90" 
                disabled={isLoading || !form.email}
              >
                {isLoading ? 'Salvando...' : 'Completar cadastro'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CrmResetPasswordInvite;
