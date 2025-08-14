import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VideoPage() {
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Mostrar botão de pagamento após 5 minutos (300 segundos)
    const timer = setTimeout(() => {
      setShowPaymentButton(true);
    }, 300000); // 5 minutos

    // Para desenvolvimento, mostrar imediatamente
    const devTimer = setTimeout(() => {
      setShowPaymentButton(true);
    }, 5000); // 5 segundos

    return () => {
      clearTimeout(timer);
      clearTimeout(devTimer);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: 'price_simulator_monthly', // Configurar no Stripe
          mode: 'subscription'
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Abrir checkout em nova aba
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-2xl font-bold text-foreground">BPSales</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost">Suporte</Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/crm/login")}
            >
              Login
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Veja como aumentar sua taxa de fechamento em menos de 7 dias
            </h1>
          </div>

          {/* Video Container */}
          <Card className="mb-8">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1"
                  title="Como aumentar sua taxa de fechamento"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    pointerEvents: 'auto'
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          {showPaymentButton && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Pronto para transformar seus resultados?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Tenha acesso completo ao simulador BPSales e multiplique seus fechamentos
                </p>
              </div>

              <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-8 text-center space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">R$ 97</div>
                    <div className="text-sm text-muted-foreground">por mês</div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Acesso completo ao simulador</li>
                    <li>✓ Todas as técnicas de apresentação</li>
                    <li>✓ Suporte prioritário</li>
                    <li>✓ Atualizações gratuitas</li>
                  </ul>

                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                    onClick={handlePayment}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Quero acesso ao simulador agora"}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Pagamento seguro via Stripe • Cancele a qualquer momento
                  </p>
                </CardContent>
              </Card>

              {/* Benefits */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary rounded-sm"></div>
                  </div>
                  <h3 className="font-semibold text-foreground">Proteção patrimonial</h3>
                  <p className="text-sm text-muted-foreground">
                    Simule diferentes cenários de proteção para seus clientes
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary rounded-sm"></div>
                  </div>
                  <h3 className="font-semibold text-foreground">Fluxo de caixa positivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Demonstre como gerar renda através de investimentos
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary rounded-sm"></div>
                  </div>
                  <h3 className="font-semibold text-foreground">Resultados comprovados</h3>
                  <p className="text-sm text-muted-foreground">
                    Mais de 17 anos de experiência no mercado
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}