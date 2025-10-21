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
// import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { Logo } from '@/components/ui/Logo';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  const { signIn, user, crmUser } = useCrmAuth();
  const navigate = useNavigate();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();

  useEffect(() => {
    // logs removidos
  }, [defaultBranding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Conta suspensa, entre em contato com seu gestor')) {
          setError('Conta suspensa, entre em contato com seu gestor');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast.success('Login realizado com sucesso!');
        // Navegação será tratada pelo fluxo de auth
      }
    } catch (err) {
      setError('Erro inesperado ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] flex items-center justify-center p-4">
      {/* Botão de alternância de tema */}
      <div className="absolute top-4 right-4">
        {/* <ThemeSwitch /> */}
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

        <Card className="w-full bg-[#1F1F1F]/95 backdrop-blur-sm shadow-xl border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-[26px] font-bold text-white mb-4">Acessar Plataforma</CardTitle>
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
                    Sua conta foi autenticada, mas ainda não há perfil. Aguarde alguns instantes e tente entrar novamente. Se o aviso persistir, contate o administrador.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite o seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20"
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Informe sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20 pr-10"
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
                className="w-full h-12 text-base md:text-lg font-semibold bg-gradient-to-r from-[#e50f5f] to-[#d40a4f] hover:opacity-90 transition-all duration-300 shadow-lg text-white"
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

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm hover:text-foreground"
                  onClick={() => setShowForgotModal(true)}
                  style={{ 
                    color: defaultBranding?.primary_color || '#E50F5E'
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

export default Login; 