import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { useDefaultBranding } from "@/hooks/useDefaultBranding";
import { useGlobalColors } from "@/hooks/useGlobalColors";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { LandingPhoneInput } from "@/components/ui/LandingPhoneInput";
import { useUserInfo } from "@/hooks/useUserInfo";

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    consortiumExperience: "", // String vazia para mostrar placeholder
    teamSize: "", // String vazia para mostrar placeholder
    browser: "",
    device: "",
    ip: "",
    fullUrl: "",
    urlWithoutParams: "",
    urlParams: "",
    utm_campaign: "",
    utm_medium: "",
    utm_content: "",
    utm_source: "",
    utm_term: "",
    gclid: "",
    fbclid: "",
    fbp: "",
    fbc: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();
  const { globalDefaultColor } = useGlobalColors();
  const userInfo = useUserInfo();

  // Opções para os dropdowns
  const consortiumExperienceOptions = [
    { value: "0", label: "Não trabalho" },
    { value: "1", label: "1 ano" },
    { value: "2", label: "2 anos" },
    { value: "3", label: "3 anos" },
    { value: "4", label: "4 anos" },
    { value: "5", label: "5 anos" },
    { value: "6", label: "6 anos" },
    { value: "7", label: "7 anos" },
    { value: "8", label: "8 anos" },
    { value: "9", label: "9 anos" },
    { value: "10", label: "10 anos" },
    { value: "11", label: "10+ anos" }
  ];

  const teamSizeOptions = [
    { value: "0", label: "Somente eu" },
    { value: "1", label: "1 vendedor" },
    { value: "2", label: "2 vendedores" },
    { value: "3", label: "3 vendedores" },
    { value: "4", label: "4 vendedores" },
    { value: "5", label: "5 vendedores" },
    { value: "10", label: "10 vendedores" },
    { value: "15", label: "15 vendedores" },
    { value: "20", label: "20 vendedores" },
    { value: "25", label: "25 vendedores" },
    { value: "30", label: "30 vendedores" },
    { value: "40", label: "40 vendedores" },
    { value: "50", label: "50 vendedores" },
    { value: "75", label: "75 vendedores" },
    { value: "100", label: "100 vendedores" },
    { value: "101", label: "100+ vendedores" }
  ];

  // Debug: Log do branding
  useEffect(() => {
    // logs removidos
  }, [defaultBranding, brandingLoading]);

  // Atualizar formData com as informações do usuário quando disponíveis
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...userInfo
    }));
  }, [userInfo]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validação do nome (primeiro nome e sobrenome obrigatórios)
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else {
      const nameParts = formData.name.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length < 2) {
        newErrors.name = "Digite seu primeiro nome e sobrenome";
      }
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Digite um email válido";
    }

    // Validação do telefone
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (phoneNumbers.length < 10) {
      newErrors.phone = "Digite um telefone válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }
    
    // log removido (lead info)
    
    // Salvar dados no localStorage para usar depois do pagamento
    localStorage.setItem("leadData", JSON.stringify(formData));
    
    // Redirecionar para página de vídeo
    navigate("/video");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
    
    // Limpar erro do telefone quando o usuário começar a digitar
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ""
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <Logo 
              className="h-10 w-auto max-w-[140px]"
              lightUrl={defaultBranding?.logo_horizontal_url || 'https://jbhocghbieqxjwsdstgm.supabase.co/storage/v1/object/public/branding/334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b/horizontal.png?v=1754695770366'}
              darkUrl={defaultBranding?.logo_horizontal_dark_url || defaultBranding?.logo_horizontal_url || 'https://jbhocghbieqxjwsdstgm.supabase.co/storage/v1/object/public/branding/334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b/horizontal_dark.png?v=1754695673945'}
              alt="BP Sales"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/crm/login")}
            className="transition-all duration-300 shadow-sm"
            style={{ 
              backgroundColor: 'transparent',
                      borderColor: defaultBranding?.primary_color || '#E50F5E',
        color: defaultBranding?.primary_color || '#E50F5E',
              borderWidth: '2px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = defaultBranding?.secondary_color || '#7c032e';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = defaultBranding?.primary_color || '#E50F5E';
        e.currentTarget.style.color = defaultBranding?.primary_color || '#E50F5E';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = defaultBranding?.secondary_color || '#7c032e';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = defaultBranding?.secondary_color || '#7c032e';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
          >
            Entrar
          </Button>
        </header>

        {/* Main Content - 2 Columns */}
        <div className="grid lg:grid-cols-10 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Content (60%) */}
          <div className="lg:col-span-6 space-y-8">
            {/* H1 Principal */}
            <h1 className="text-3xl md:text-[44px] leading-snug font-bold text-white mb-4">
              Seu cliente se sentirá burro em não fechar um consórcio com você!
            </h1>
            
            {/* Texto Descritivo */}
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mb-8">
              Eu vou te entregar em <strong className="text-white">5 minutos</strong> as <strong className="text-white">2 técnicas</strong> e <strong className="text-white">1 Ferramenta</strong> de apresentação de consórcio que transformam pessoas de alta renda em clientes.
            </p>
            
            {/* Imagem do Vídeo */}
            <div className="relative bg-gradient-to-br from-[#2A2A2A] via-[#1F1F1F] to-[#161616] rounded-2xl aspect-video flex items-center justify-center group cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl border border-white/10">
              <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
              <div className="relative z-10 w-16 h-16 rounded-full bg-white text-black shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center">
                <Play className="w-6 h-6 ml-1" />
              </div>
            </div>
          </div>

          {/* Right Column - Form (40%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Título do Formulário */}
            <div className="text-center">
              <h3 className="text-xl md:text-[26px] font-bold text-white mb-2">
                Cadastre-se e assista gratuitamente
              </h3>
            </div>
            
            <Card className="w-full bg-[#1F1F1F]/95 backdrop-blur-sm shadow-xl border-white/10">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campos Hidden com Informações do Usuário */}
                  <input type="hidden" name="browser" value={formData.browser} />
                  <input type="hidden" name="device" value={formData.device} />
                  <input type="hidden" name="ip" value={formData.ip} />
                  <input type="hidden" name="fullUrl" value={formData.fullUrl} />
                  <input type="hidden" name="urlWithoutParams" value={formData.urlWithoutParams} />
                  <input type="hidden" name="urlParams" value={formData.urlParams} />
                  <input type="hidden" name="utm_campaign" value={formData.utm_campaign} />
                  <input type="hidden" name="utm_medium" value={formData.utm_medium} />
                  <input type="hidden" name="utm_content" value={formData.utm_content} />
                  <input type="hidden" name="utm_source" value={formData.utm_source} />
                  <input type="hidden" name="utm_term" value={formData.utm_term} />
                  <input type="hidden" name="gclid" value={formData.gclid} />
                  <input type="hidden" name="fbclid" value={formData.fbclid} />
                  <input type="hidden" name="fbp" value={formData.fbp} />
                  <input type="hidden" name="fbc" value={formData.fbc} />

                  {/* Nome e Sobrenome */}
                  <div className="space-y-2">
                    <Input
                      name="name"
                      placeholder="Nome e sobrenome"
                      value={formData.name}
                      onChange={handleChange}
                      className={`h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-page-input ${
                        errors.name ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Input
                      name="email"
                      type="email"
                      placeholder="E-mail"
                      value={formData.email}
                      onChange={handleChange}
                      className={`h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-page-input ${
                        errors.email ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">{errors.email}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <LandingPhoneInput
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="Telefone"
                      error={errors.phone}
                      globalDefaultColor={globalDefaultColor}
                    />
                  </div>

                  {/* Experiência com Consórcio */}
                  <div className="space-y-2">
                    <Select
                      value={formData.consortiumExperience}
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          consortiumExperience: value
                        }));
                      }}
                    >
                      <SelectTrigger className={`${!formData.consortiumExperience ? 'text-[#9BA3AF]' : 'text-white'} h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 focus:ring-white/20 landing-page-input`}>
                        <SelectValue placeholder="A quanto tempo trabalha com consórcio?" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white">
                        {consortiumExperienceOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value} 
                            className="text-base md:text-lg hover:bg-[#e50f5f] data-[highlighted]:bg-[#e50f5f] data-[highlighted]:text-white data-[state=checked]:bg-[#7c032e] data-[state=checked]:text-white"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantidade de Vendedores */}
                  <div className="space-y-2">
                    <Select
                      value={formData.teamSize}
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          teamSize: value
                        }));
                      }}
                    >
                      <SelectTrigger className={`${!formData.teamSize ? 'text-[#9BA3AF]' : 'text-white'} h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 focus:ring-white/20 landing-page-input`}>
                        <SelectValue placeholder="Quantos vendedores você tem?" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/20 text-white">
                        {teamSizeOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value} 
                            className="text-base md:text-lg hover:bg-[#e50f5f] data-[highlighted]:bg-[#e50f5f] data-[highlighted]:text-white data-[state=checked]:bg-[#7c032e] data-[state=checked]:text-white"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão de Submit */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base md:text-lg font-semibold bg-gradient-to-r from-[#e50f5f] to-[#d40a4f] hover:opacity-90 transition-all duration-300 shadow-lg text-white"
                  >
                    Quero assistir agora
                  </Button>

                  {/* Texto de Proteção */}
                  <div className="flex items-center justify-center space-x-2 text-xs md:text-base text-gray-400 mt-4">
                    <Lock className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Seus dados estão 100% protegidos</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#131313] py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              {brandingLoading ? (
                <div className="h-8 w-32 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                <Logo 
                  className="h-8 w-auto max-w-[120px]"
                  lightUrl={defaultBranding?.logo_horizontal_url || null}
                  darkUrl={defaultBranding?.logo_horizontal_dark_url || defaultBranding?.logo_horizontal_url || null}
                  alt="BP Sales"
                />
              )}
            </div>
            
            {/* Texto Descritivo */}
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-300 text-sm leading-relaxed">
                BP Sales é uma empresa de engenharia comercial que ajuda empresas existentes a vender seus produtos e serviços com processos de vendas e automações que substituem trabalhos reptitivos. Não fazemos nenhuma afirmação ou representação de que, ao contratar a BP Sales, você ganhará dinheiro ou receberá seu dinheiro de volta. Embora tenhamos grandes experiências reais, os resultados e a experiência de sua empresa variará com base no esforço, na aplicação dos funcionários e da administração de sua empresa, no modelo de negócios implementado e nas forças de mercado entre outros fatores interferentes.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}