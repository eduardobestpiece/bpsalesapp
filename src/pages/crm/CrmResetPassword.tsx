import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CrmResetPassword = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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

    try {
      // Enviar e-mail de redefinição de senha
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin + '/crm/redefinir-senha',
      });
      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }
      setSuccess(true);
      toast.success('Se o e-mail estiver correto, você receberá instruções para redefinir sua senha.');
      setTimeout(() => navigate('/crm/login'), 2000);
    } catch (err: any) {
      setError('Erro ao solicitar redefinição. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Informe seu e-mail e defina uma nova senha para acessar a plataforma.
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
                <Alert variant="success">
                  <AlertDescription>Solicitação enviada! Verifique seu e-mail.</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Repita a senha</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required disabled={isLoading} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Redefinir Senha'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CrmResetPassword; 