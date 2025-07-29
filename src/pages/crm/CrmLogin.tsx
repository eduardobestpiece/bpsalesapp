
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import ForgotPasswordModal from '@/components/Auth/ForgotPasswordModal';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { Logo } from '@/components/ui/Logo';

const CrmLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  const { signIn } = useCrmAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast.success('Login realizado com sucesso!');
        // Navigation will be handled by AuthGuard
      }
    } catch (err) {
      setError('Erro inesperado ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#131313] dark:to-[#1E1E1E] flex items-center justify-center p-4">
      {/* Botão de alternância de tema */}
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="h-24 mx-auto mb-2" />
        </div>

        <Card className="shadow-lg border-0 bg-background dark:bg-[#1F1F1F] border-border dark:border-[#A86F57]/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground dark:text-white">Entrar no Sistema</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-gray-300">
              Acesse sua conta para gerenciar leads e vendas
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-background dark:bg-[#131313] border-border dark:border-[#A86F57]/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground dark:text-white">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-background dark:bg-[#131313] border-border dark:border-[#A86F57]/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-[#A86F57] hover:bg-[#A86F57]/80 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="flex flex-col items-center space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[#A86F57] hover:underline dark:text-[#A86F57]"
                  disabled={isLoading}
                >
                  Esqueci a senha
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <ForgotPasswordModal 
          open={showForgotModal} 
          onOpenChange={setShowForgotModal} 
        />
      </div>
    </div>
  );
};

export default CrmLogin;
