import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mostrar mensagem de sucesso
    toast.success("Pagamento realizado com sucesso!");
    
    // Limpar dados temporários
    localStorage.removeItem("leadData");
    
    // Redirecionar automaticamente após 5 segundos
    const timer = setTimeout(() => {
      navigate("/crm/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Pagamento confirmado!
              </h1>
              <p className="text-muted-foreground">
                Parabéns! Você agora tem acesso completo ao simulador BPSales.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Você receberá um e-mail com suas credenciais de acesso em breve.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o login em 5 segundos...
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate("/crm/login")}
              >
                Fazer login agora
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}