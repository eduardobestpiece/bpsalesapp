
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';

const CrmLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  const { signIn, user, crmUser } = useCrmAuth();
  const navigate = useNavigate();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();

  // Debug: Log do branding
  useEffect(() => {
    console.log('🔐 Login - Branding carregado:', defaultBranding);
    console.log('🔐 Login - Logo URL:', defaultBranding?.logo_horizontal_url);
  }, [defaultBranding]);

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
          {brandingLoading ? (
            <div className="h-24 w-48 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
          ) : (
            <Logo 
              className="h-24 mx-auto mb-2" 
              lightUrl={defaultBranding?.logo_horizontal_url || null}
              darkUrl={defaultBranding?.logo_horizontal_dark_url || defaultBranding?.logo_horizontal_url || null}
              alt="BP Sales"
            />
          )}
        </div>

        <Card className="shadow-lg border-0 bg-background dark:bg-[#1F1F1F] border-border" style={{ borderColor: 'rgba(var(--brand-rgb, 168,110,87), 0.20)' }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground dark:text-white">Acessar Plataforma</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-gray-300">
              Preencha os campos para acessar a plataforma
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {user && !crmUser && (
                <Alert>
                  <AlertDescription>
                    Sua conta foi autenticada, mas ainda não há perfil no CRM. Aguarde alguns instantes e tente entrar novamente. Se o aviso persistir, contate o administrador.
                  </AlertDescription>
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
                  className="bg-background dark:bg-[#1F1F1F] border-border text-foreground dark:text-white"
                  style={{ 
                    borderColor: defaultBranding?.secondary_color || '#7c032e',
                    borderWidth: '2px'
                  }}
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
                    className="bg-background dark:bg-[#1F1F1F] border-border text-foreground dark:text-white pr-10"
                    style={{ 
                      borderColor: defaultBranding?.secondary_color || '#7c032e',
                      borderWidth: '2px'
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full text-white font-semibold"
                disabled={isLoading}
                style={{ 
                  backgroundColor: defaultBranding?.primary_color || '#e50f5f',
                  borderColor: defaultBranding?.primary_color || '#e50f5f'
                }}
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

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm hover:text-foreground"
                  onClick={() => setShowForgotModal(true)}
                  style={{ 
                    color: defaultBranding?.primary_color || '#e50f5f'
                  }}
                >
                  Esqueci a senha
                </Button>
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
