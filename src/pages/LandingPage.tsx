import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    // Salvar dados no localStorage para usar depois do pagamento
    localStorage.setItem("leadData", JSON.stringify(formData));
    
    // Redirecionar para página de vídeo
    navigate("/video");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-2xl font-bold text-foreground">BPSales</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/crm/login")}
            className="border-primary/20 text-primary hover:bg-primary/10"
          >
            Entrar
          </Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                Seu cliente vai se sentir maluco de não fechar com você...
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Descubra as <strong>2 técnicas de apresentação</strong> io de consórcio que transformam indecisos em compradores imediatos.
              </p>
            </div>

            {/* Form */}
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    name="name"
                    placeholder="Nome"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-12 text-base"
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="E-mail"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 text-base"
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                  >
                    Quero assistir agora
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Seus dados estão 100% protegidos
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Video Preview */}
          <div className="space-y-8">
            <div className="text-center space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Veja como aumentar sua taxa de fechamento em menos de 7 ias
              </h2>
              
              {/* Video Preview */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl aspect-video flex items-center justify-center group cursor-pointer hover:scale-105 transition-transform">
                <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
                <Button
                  size="lg"
                  className="relative z-10 w-16 h-16 rounded-full bg-white text-primary hover:bg-white/90 shadow-2xl"
                  onClick={() => navigate("/video")}
                >
                  <Play className="w-6 h-6 ml-1" />
                </Button>
              </div>

              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3"
                onClick={() => navigate("/video")}
              >
                Quero acesso ao simulador agora
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Proteção</p>
                  <p className="text-sm text-muted-foreground">patrimonial</p>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Fluxo de caixa</p>
                  <p className="text-sm text-muted-foreground">positivo</p>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">As Parágrafos</p>
                  <p className="text-sm text-muted-foreground">parmilinional</p>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">17+</p>
                  <p className="text-sm text-muted-foreground">Anos</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src="/lovable-uploads/956791e6-1ca1-413b-8054-cd43b7715cb8.png" 
                    alt="Depoimento"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      "Fechei dois negócios grandes em seguência depois de usar técnicas!"
                    </p>
                    <p className="font-semibold text-foreground">Ertanuel</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}