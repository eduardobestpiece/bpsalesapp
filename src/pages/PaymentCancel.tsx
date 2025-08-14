import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Pagamento cancelado
              </h1>
              <p className="text-muted-foreground">
                Não se preocupe! Você pode tentar novamente a qualquer momento.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate("/video")}
              >
                Tentar novamente
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