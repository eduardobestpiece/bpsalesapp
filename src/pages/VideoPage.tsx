import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDefaultBranding } from "@/hooks/useDefaultBranding";
import { Logo } from "@/components/ui/Logo";

export default function VideoPage() {
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappForm, setWhatsappForm] = useState({
    name: '',
    phone: ''
  });
  const navigate = useNavigate();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();

  // Debug: Log do branding
  useEffect(() => {
    console.log('🎥 Video - Branding carregado:', defaultBranding);
    console.log('🎥 Video - Logo URL:', defaultBranding?.logo_horizontal_url);
  }, [defaultBranding]);

  useEffect(() => {
    // Simular tempo de carregamento do vídeo
    const timer = setTimeout(() => {
      setShowPaymentButton(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirecionar para página de sucesso
      navigate("/payment-success");
    } catch (error) {
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getGreetingMessage = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 12) {
      return "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde";
    } else if (hour >= 18 && hour < 24) {
      return "Boa noite";
    } else {
      return "Boa madrugada";
    }
  };

  const handleWhatsAppSubmit = () => {
    if (!whatsappForm.name.trim() || !whatsappForm.phone.trim()) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const firstName = whatsappForm.name.split(' ')[0];
    const greeting = getGreetingMessage();
    const message = `${greeting} Eduardo, tudo bem? Me chamo ${firstName} e ainda tenho dúvidas sobre o simulador.`;
    
    const whatsappUrl = `https://wa.me/5561981719292?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setShowWhatsAppModal(false);
    setWhatsappForm({ name: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            {brandingLoading ? (
              <div className="h-10 w-32 bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <Logo 
                className="h-10 w-auto max-w-[140px]"
                lightUrl={defaultBranding?.logo_horizontal_url || null}
                darkUrl={defaultBranding?.logo_horizontal_dark_url || defaultBranding?.logo_horizontal_url || null}
                alt="BP Sales"
              />
            )}
          </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/crm/login")}
            className="transition-all duration-300 shadow-sm"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: defaultBranding?.primary_color || '#e50f5f',
              color: defaultBranding?.primary_color || '#e50f5f',
              borderWidth: '2px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = defaultBranding?.secondary_color || '#7c032e';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = defaultBranding?.primary_color || '#e50f5f';
              e.currentTarget.style.color = defaultBranding?.primary_color || '#e50f5f';
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

        <div className="text-center space-y-6 mb-12">
          <h1 className="text-3xl md:text-[44px] font-bold text-white mb-4">
            Veja como tornar sua simulação absurdamente persuasiva
            </h1>
                      <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto">
                          De o play no vídeo e veja como uma simples simulação pode deixar seu cliente sem saídas, sendo obrigado pela própria racionalidade a fechar com você
          </p>
          </div>

        {/* Video Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-[#1F1F1F] border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src="https://drive.google.com/file/d/1qwoKlEJD_fmw7271zSMf-GZy3RkvpJKS/preview"
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen={false}
                  title="Vídeo de Simulação Persuasiva"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#e50f5f]/20 to-[#e50f5f]/10 rounded-xl mx-auto flex items-center justify-center shadow-lg border border-[#e50f5f]/20">
                <svg className="w-8 h-8 text-[#e50f5f]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-[26px] font-bold text-white">
                Chega de apresentar somente números e planilhas
              </h3>
              <p className="text-base md:text-lg text-gray-300">
                Transforme dados complexos em visualizações que seu cliente entende instantaneamente
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#e50f5f]/20 to-[#e50f5f]/10 rounded-xl mx-auto flex items-center justify-center shadow-lg border border-[#e50f5f]/20">
                <svg className="w-8 h-8 text-[#e50f5f]" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M 113 415 L 113 456 L 400 456 L 400 415 L 395 405 L 381 396 L 132 396 L 122 401 Z  M 202 384 L 311 385 L 289 362 L 281 346 L 278 332 L 257 339 L 235 332 L 232 346 L 224 362 Z  M 64 100 L 66 148 L 82 181 L 108 204 L 152 216 L 195 288 L 253 328 L 284 317 L 318 288 L 361 216 L 393 210 L 420 193 L 449 137 L 447 96 L 390 91 L 378 57 L 135 57 L 122 91 L 74 91 Z  M 423 116 L 423 137 L 414 160 L 397 178 L 383 186 L 371 189 L 370 188 L 382 148 L 387 118 L 389 116 Z  M 90 116 L 124 116 L 126 118 L 130 144 L 143 188 L 142 189 L 130 186 L 122 182 L 111 174 L 102 164 L 92 145 L 89 129 Z  M 203 142 L 240 136 L 256 104 L 273 136 L 310 142 L 284 167 L 289 204 L 258 188 L 224 204 L 229 167 Z " fill="currentColor" fill-rule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-[26px] font-bold text-white">
                Mostre resultados impossíveis de contestar em segundos
              </h3>
              <p className="text-base md:text-lg text-gray-300">
                Demonstrações visuais que eliminam objeções e criam convicção imediata
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#e50f5f]/20 to-[#e50f5f]/10 rounded-xl mx-auto flex items-center justify-center shadow-lg border border-[#e50f5f]/20">
                <svg className="w-8 h-8 text-[#e50f5f]" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M 371 183 L 269 277 L 251 280 L 233 263 L 236 244 L 323 155 L 289 157 L 257 176 L 206 154 L 159 167 L 132 199 L 126 243 L 138 274 L 181 320 L 144 357 L 121 357 L 77 403 L 107 403 L 109 434 L 193 332 L 257 394 L 378 269 L 387 220 Z  M 398 114 L 338 115 L 337 124 L 341 128 L 372 129 L 250 251 L 251 263 L 262 263 L 384 141 L 385 172 L 389 176 L 399 174 Z " fill="currentColor" fill-rule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-[26px] font-bold text-white">
                Provoque o fechamento na hora, sem parecer vendedor
              </h3>
              <p className="text-base md:text-lg text-gray-300">
                O cliente se convence sozinho através da simulação, não da sua persuasão
              </p>
            </div>
          </div>
        </div>

        {/* Why is it so persuasive? Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid lg:grid-cols-3 gap-8 items-center mb-16">
            {/* Photo */}
            <div className="lg:col-span-1 flex justify-center lg:justify-start">
              <div className="relative">
                <img 
                  src="/Eduardo destaque do ano.JPG" 
                  alt="Eduardo - Destaque do Ano" 
                  className="w-64 h-64 lg:w-80 lg:h-80 object-cover rounded-2xl shadow-2xl border-4 border-[#e50f5f]/20"
                />
                <div className="absolute -bottom-4 -right-4 bg-[#e50f5f] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  Destaque do Ano
                </div>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="lg:col-span-2 text-center lg:text-left">
              <h2 className="text-2xl md:text-[32px] font-bold text-white mb-6">
                Porque é tão persuasivo?
              </h2>
              <p className="text-base md:text-xl text-gray-300 max-w-4xl mx-auto lg:mx-0">
                Simulador feito por quem esteve por 2 anos e 6 meses na linha de frente de uma das maiores operações de consórcios do país, mapeando absolutamente várias objeções, mapeando as oportunidades de mercado e criando processos e estratégias que geraram mais de 200 milhões em vendas nos últimos 2 anos com ticket médio altíssimo.
              </p>
            </div>
          </div>

          {/* Dashboard Image */}
          <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10">

            <div className="text-center mb-6">
              <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">Resultados Reais de Vendas</h3>
              <p className="text-sm md:text-lg text-gray-300 mb-4">
                Dashboard de performance com mais de R$ 513 milhões em produção
              </p>
              {/* Mobile scroll indicator */}
              <div className="lg:hidden">
                <p className="text-gray-400 text-xs">(role para os lados para ver)</p>
              </div>
            </div>
            
            {/* Dashboard Mockup */}
            <div className="bg-[#1A1A1A] rounded-lg p-6 space-y-6 overflow-x-auto">
              {/* Performance Charts Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 min-w-max">
                {/* Left Column - KPIs and Performance by Consultant */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                  {/* KPIs Row */}
                  <div className="grid grid-cols-2 gap-4 min-w-max">
                    <div className="bg-[#2A2A2A] rounded-lg p-4 text-center">
                      <div className="text-green-400 text-sm font-semibold">PRODUÇÃO</div>
                      <div className="text-white text-sm md:text-lg font-bold">R$ 513.674.910,28</div>
                    </div>
                    <div className="bg-[#2A2A2A] rounded-lg p-4 text-center">
                      <div className="text-green-400 text-sm font-semibold">PROPOSTAS</div>
                      <div className="text-white text-sm md:text-lg font-bold">1.155</div>
                    </div>
                    <div className="bg-[#2A2A2A] rounded-lg p-4 text-center">
                      <div className="text-green-400 text-sm font-semibold">TICKET MÉDIO</div>
                      <div className="text-white text-sm md:text-lg font-bold">R$ 444.740,18</div>
                    </div>
                    <div className="bg-[#2A2A2A] rounded-lg p-4 text-center">
                      <div className="text-green-400 text-sm font-semibold">CLIENTES</div>
                      <div className="text-white text-sm md:text-lg font-bold">941</div>
                    </div>
                  </div>

                  {/* Performance by Consultant */}
                  <div className="bg-[#2A2A2A] rounded-lg p-6 min-w-max">
                    <h4 className="text-white text-sm md:text-lg font-semibold mb-4">PERFORMANCE POR CONSULTOR</h4>
                    <div className="lg:h-96 lg:flex lg:flex-col lg:justify-between">
                      {/* Desktop: Show all consultants */}
                      <div className="hidden lg:block">
                        {[
                          { name: "Vendedor 1", value: 95, meta: 100 },
                          { name: "Vendedor 2", value: 88, meta: 100 },
                          { name: "Vendedor 3", value: 82, meta: 100 },
                          { name: "Vendedor 4", value: 75, meta: 100 },
                          { name: "Vendedor 5", value: 70, meta: 100 },
                          { name: "Vendedor 6", value: 65, meta: 100 },
                          { name: "Vendedor 7", value: 60, meta: 100 },
                          { name: "Vendedor 8", value: 55, meta: 100 },
                          { name: "Vendedor 9", value: 50, meta: 100 },
                          { name: "Vendedor 10", value: 45, meta: 100 },
                          { name: "Vendedor 11", value: 40, meta: 100 },
                          { name: "Vendedor 12", value: 35, meta: 100 },
                          { name: "Vendedor 13", value: 30, meta: 100 },
                          { name: "Vendedor 14", value: 25, meta: 100 },
                          { name: "Vendedor 15", value: 20, meta: 100 }
                        ].map((consultant, index) => (
                          <div key={index} className="flex items-center space-x-4 h-6">
                            <div className="text-white text-sm w-32 truncate">{consultant.name}</div>
                            <div className="flex-1 bg-[#1A1A1A] rounded-full h-4">
                              <div 
                                className="bg-gradient-to-r from-[#e50f5f] to-[#7c032e] h-4 rounded-full transition-all duration-300"
                                style={{ width: `${consultant.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Mobile: Show only first 5 + dots */}
                      <div className="lg:hidden space-y-1">
                        {[
                          { name: "Vendedor 1", value: 95, meta: 100 },
                          { name: "Vendedor 2", value: 88, meta: 100 },
                          { name: "Vendedor 3", value: 82, meta: 100 },
                          { name: "Vendedor 4", value: 75, meta: 100 },
                          { name: "Vendedor 5", value: 70, meta: 100 }
                        ].map((consultant, index) => (
                          <div key={index} className="flex items-center space-x-1 py-1">
                            <div className="text-white text-sm w-24 truncate">{consultant.name}</div>
                            <div className="flex-1 bg-[#1A1A1A] rounded-full h-4 mx-1">
                              <div 
                                className="bg-gradient-to-r from-[#e50f5f] to-[#7c032e] h-4 rounded-full transition-all duration-300"
                                style={{ width: `${consultant.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        {/* Dots indicator */}
                        <div className="flex items-center space-x-1 py-1">
                          <div className="text-white text-sm w-24 truncate">...</div>
                          <div className="flex-1 bg-[#1A1A1A] rounded-full h-4 mx-1">
                            <div className="bg-gray-600 h-4 rounded-full w-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Donut Charts */}
                <div className="col-span-1 lg:col-span-1 space-y-6 min-w-max">
                  {/* Performance by Origin - Donut Chart */}
                  <div className="bg-[#2A2A2A] rounded-lg p-6">
                    <h4 className="text-white text-sm md:text-lg font-semibold mb-4 text-center">PERFORMANCE POR ORIGEM</h4>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#1A1A1A"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeDasharray="37.6, 100"
                            strokeDashoffset="0"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="3"
                            strokeDasharray="27.7, 100"
                            strokeDashoffset="-37.6"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="3"
                            strokeDasharray="15.7, 100"
                            strokeDashoffset="-65.3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="3"
                            strokeDasharray="19.0, 100"
                            strokeDashoffset="-81"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-white text-sm md:text-2xl font-bold">R$ 513M</div>
                            <div className="text-gray-400 text-xs">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                          <span className="text-white text-sm">Network pessoal</span>
                        </div>
                        <span className="text-white text-sm font-semibold">37.6%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-white text-sm">Marketing Digital</span>
                        </div>
                        <span className="text-white text-sm font-semibold">27.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                          <span className="text-white text-sm">Recomendações</span>
                        </div>
                        <span className="text-white text-sm font-semibold">15.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          <span className="text-white text-sm">Outros</span>
                        </div>
                        <span className="text-white text-sm font-semibold">19.0%</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance by Profession - Donut Chart */}
                  <div className="bg-[#2A2A2A] rounded-lg p-6">
                    <h4 className="text-white text-sm md:text-lg font-semibold mb-4 text-center">PERFORMANCE POR PROFISSÃO</h4>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#1A1A1A"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#9333ea"
                            strokeWidth="3"
                            strokeDasharray="45.2, 100"
                            strokeDashoffset="0"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#db2777"
                            strokeWidth="3"
                            strokeDasharray="28.7, 100"
                            strokeDashoffset="-45.2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeDasharray="18.3, 100"
                            strokeDashoffset="-73.9"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth="3"
                            strokeDasharray="7.8, 100"
                            strokeDashoffset="-92.2"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-white text-sm md:text-2xl font-bold">941</div>
                            <div className="text-gray-400 text-xs">Clientes</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          <span className="text-white text-sm">Empresários</span>
                        </div>
                        <span className="text-white text-sm font-semibold">45.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-pink-600 rounded-full"></div>
                          <span className="text-white text-sm">Profissionais Liberais</span>
                        </div>
                        <span className="text-white text-sm font-semibold">28.7%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                          <span className="text-white text-sm">Executivos</span>
                        </div>
                        <span className="text-white text-sm font-semibold">18.3%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                          <span className="text-white text-sm">Outros</span>
                        </div>
                        <span className="text-white text-sm font-semibold">7.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulator Features Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="text-center mb-16">
                          <h2 className="text-2xl md:text-[32px] font-bold text-white mb-6">
              Funcionalidades com foco em conversão
                </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-4xl mx-auto">
              Cada funcionalidade e informacão do simulador BP Sales foi milimetricamente pensado na experiência do usuário e em gerar cognitivamente na mente do cliente uma sensação de ganhos absolutos
                </p>
              </div>



          {/* Features Grid */}
          <div className="space-y-12">
            {/* Montagem de Cotas - Interactive */}
            <div 
              className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 hover:border-[#e50f5f]/50 hover:shadow-lg hover:shadow-[#e50f5f]/20 transition-all duration-300 group"
            >
              <div className="w-full">
                <div className="w-full">
                  
                  {/* Desktop and Content Layout */}
                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* Desktop Interface - Mobile: segunda coluna, Desktop: primeira coluna */}
                    <div className="lg:col-span-3 lg:order-1 order-2 relative">
                      <div className="bg-[#1A1A1A] rounded-md p-3 space-y-3">
                        {/* Top Summary Bar */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#2A2A2A] rounded p-2">
                            <div className="text-green-400 text-xs font-semibold">Total do Crédito</div>
                            <div className="text-white text-sm font-bold">R$ 1.800.000</div>
                          </div>
                          <div className="bg-[#2A2A2A] rounded p-2">
                            <div className="text-green-400 text-xs font-semibold">Acréscimo no Crédito</div>
                            <div className="text-white text-sm font-bold">R$ 280.000</div>
                          </div>
                        </div>
                        
                        {/* Quota Entries */}
                        <div className="space-y-2">
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="bg-[#2A2A2A] rounded p-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 border border-white/30 rounded-full"></div>
                                <div>
                                  <div className="text-white text-sm font-semibold">R$ 600.000,00 (Imóvel)</div>
                                  <div className="text-gray-400 text-xs">Crédito: R$ 600.000 | Parcela: R$ 1.975</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white text-xs bg-[#1A1A1A] px-2 py-1 rounded">Qtd: 1</span>
                                <div className="w-4 h-4 text-red-400">🗑️</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <button className="bg-black text-white text-xs px-3 py-1 rounded flex items-center space-x-1">
                            <span>+</span>
                            <span>Selecionar Crédito</span>
                          </button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="bg-black text-white text-xs px-3 py-2 rounded flex-1">Redefinir</button>
                          <button className="bg-[#e50f5f] text-white text-xs px-3 py-2 rounded flex-1">Salvar</button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interactive Content - Mobile: primeira coluna, Desktop: segunda coluna */}
                    <div className="lg:col-span-2 lg:order-2 order-1 flex flex-col justify-center h-full">
                      <div className="space-y-6">
                      <div>
                          <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">Montagem de Cotas</h3>
                          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                          Monte facilmente diferentes combinações de crédito para seus clientes. Selecione múltiplas cotas, ajuste quantidades e visualize o impacto total na proposta.
                        </p>
                      </div>
                      
                        <div className="space-y-3">
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Seleção múltipla de créditos
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Ajuste de quantidades por cota
                        </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Geração automática de propostas
                          </div>
                          </div>


                          </div>
                    </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
            {/* Alavancagem Financeira - Interactive */}
            <div 
              className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 hover:border-[#e50f5f]/50 hover:shadow-lg hover:shadow-[#e50f5f]/20 transition-all duration-300 group"
            >
              <div className="w-full">
                <div className="w-full">
                  
                                     {/* Desktop and Content Layout */}
                   <div className="grid lg:grid-cols-5 gap-8">
                     {/* Interactive Content */}
                     <div className="lg:col-span-2 flex flex-col justify-center h-full">
                       <div className="space-y-6">
                         <div>
                           <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">Alavancagem Financeira</h3>
                           <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                             Visualize o poder da alavancagem financeira com gráficos interativos. Veja como o ágio, lucro e ROI evoluem mês a mês, criando argumentos irresistíveis.
                           </p>
                         </div>
                         
                         <div className="space-y-3">
                        <div className="flex items-center text-base md:text-lg text-gray-400">
                             <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                             Gráficos de evolução do lucro
                        </div>
                        <div className="flex items-center text-base md:text-lg text-gray-400">
                             <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                             Cálculo automático de ROI
                        </div>
                        <div className="flex items-center text-base md:text-lg text-gray-400">
                             <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                             Análise de ágio e custos
                           </div>
                         </div>
                        </div>
                      </div>

                     {/* Desktop Interface */}
                     <div className="lg:col-span-3 relative overflow-hidden">
                       <div className="bg-[#1A1A1A] rounded-md p-3 space-y-3">
                               {/* Top KPIs Bar */}
                               <div className="space-y-2 min-w-max">
                                 {/* Primeira linha: Valor do Ágio e Soma das Parcelas */}
                                 <div className="grid grid-cols-2 gap-2">
                                   <div className="bg-[#2A2A2A] rounded p-2">
                                     <div className="text-green-400 text-xs font-semibold">Valor do Ágio</div>
                                     <div className="text-white text-sm font-bold">R$ 257.866,20</div>
                                   </div>
                                   <div className="bg-[#2A2A2A] rounded p-2">
                                     <div className="text-green-400 text-xs font-semibold">Soma das Parcelas</div>
                                     <div className="text-white text-sm font-bold">R$ 186.380,11</div>
                                   </div>
                                 </div>
                                 {/* Segunda linha: Valor do Lucro e ROI da Operação */}
                                 <div className="grid grid-cols-2 gap-2">
                                   <div className="bg-[#2A2A2A] rounded p-2">
                                     <div className="text-green-400 text-xs font-semibold">Valor do Lucro</div>
                                     <div className="text-white text-sm font-bold">R$ 71.486,09</div>
                                   </div>
                                   <div className="bg-[#2A2A2A] rounded p-2">
                                     <div className="text-green-400 text-xs font-semibold">ROI da Operação</div>
                                     <div className="text-white text-sm font-bold">38.35%</div>
                                   </div>
                                 </div>
                               </div>

                               {/* Chart Section */}
                               <div className="bg-[#2A2A2A] rounded p-3">
                                 <div className="flex items-center justify-between mb-2">
                                   <span className="text-white text-sm font-semibold">Evolução do Lucro por Mês</span>
                                   <div className="w-4 h-4 text-[#e50f5f]">⚙️</div>
                                 </div>
                                 {/* Mobile scroll indicator */}
                                 <div className="lg:hidden mb-2">
                                   <p className="text-gray-400 text-xs">(role para os lados para ver)</p>
                                 </div>
                                 <div className="overflow-x-auto lg:overflow-visible">
                                   <div className="min-w-[980px] lg:min-w-full h-32 bg-[#1A1A1A] rounded p-2">
                                     {/* Chart Bars */}
                                     <div className="flex items-end justify-between h-full space-x-1">
                                       {[30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((month, index) => (
                                         <div key={month} className="flex-1 bg-[#e50f5f] rounded-t" style={{ 
                                           height: `${Math.max(5, (index * 3.5) + 10)}%`,
                                           minHeight: '4px'
                                         }}></div>
                                       ))}
                                     </div>
                                     {/* Chart Labels */}
                                     <div className="flex justify-between text-xs text-gray-400 mt-1">
                                       <span>30</span>
                                       <span>15</span>
                                       <span>1</span>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                      </div>
                     </div>
                   </div>
                      </div>
                    </div>
                  </div>



            {/* Alavancagem Patrimonial - Desktop Interface */}
            <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 mb-8">
              <div className="w-full">
                <div className="w-full">
                  {/* Desktop and Content Layout */}
                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* Desktop Interface - Mobile: segunda coluna, Desktop: primeira coluna */}
                    <div className="lg:col-span-3 lg:order-1 order-2 relative">
                      <div className="bg-[#1A1A1A] rounded-md p-3 space-y-3">
                        {/* Results Section */}
                        <div className="space-y-2">
                          <div className="text-white text-sm font-semibold mb-2">Resultados</div>
                          {/* Desktop: 4 colunas, Mobile: 2 colunas organizadas em 4 linhas */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {/* Linha 1: Patrimônio na Contemplação e Parcela Pós-Contemplação */}
                            <div className="bg-[#2A2A2A] rounded p-2 order-1">
                              <div className="text-[#e50f5f] text-xs font-semibold">Patrimônio na Contemplação</div>
                              <div className="text-white text-sm font-bold">R$ 1.200.000,00</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2 order-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Parcela Pós-Contemplação</div>
                              <div className="text-white text-sm font-bold">R$ 8.280,60</div>
                            </div>
                            {/* Linha 2: Ganhos Mensais e Fluxo de Caixa */}
                            <div className="bg-[#2A2A2A] rounded p-2 order-3">
                              <div className="text-[#e50f5f] text-xs font-semibold">Ganhos Mensais</div>
                              <div className="text-white text-sm font-bold">R$ 10.488,00</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2 order-4">
                              <div className="text-[#e50f5f] text-xs font-semibold">Fluxo de Caixa</div>
                              <div className="text-white text-sm font-bold">R$ 2.207,40</div>
                            </div>
                            {/* Linha 3: Patrimônio final e Renda passiva */}
                            <div className="bg-[#2A2A2A] rounded p-2 order-5">
                              <div className="text-[#e50f5f] text-xs font-semibold">Patrimônio final</div>
                              <div className="text-white text-sm font-bold">R$ 3.247.056</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2 order-6">
                              <div className="text-[#e50f5f] text-xs font-semibold">Renda passiva</div>
                              <div className="text-white text-sm font-bold">R$ 28.379,27</div>
                            </div>
                            {/* Linha 4: Investimento e Pago pelo inquilino */}
                            <div className="bg-[#2A2A2A] rounded p-2 order-7">
                              <div className="text-[#e50f5f] text-xs font-semibold">Investimento</div>
                              <div className="text-white text-sm font-bold">14,67%</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2 order-8">
                              <div className="text-[#e50f5f] text-xs font-semibold">Pago pelo inquilino</div>
                              <div className="text-white text-sm font-bold">85,33%</div>
                            </div>
                          </div>
                        </div>

                        {/* Asset Evolution Chart */}
                        <div className="bg-[#2A2A2A] rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-semibold">Evolução Patrimonial</span>
                            <div className="w-4 h-4 text-[#e50f5f]">📈</div>
                          </div>
                          {/* Mobile scroll indicator */}
                          <div className="lg:hidden mb-2">
                            <p className="text-gray-400 text-xs">(role para os lados para ver)</p>
                          </div>
                          <div className="h-36 bg-[#1A1A1A] rounded p-4 relative">
                            {/* Chart SVG */}
                            <div className="relative h-full">
                              {/* Tooltip with financial data */}
                              <div className="hidden lg:block absolute -top-2 right-0 bg-[#2A2A2A] rounded-lg p-2 text-xs border border-white/20 shadow-lg z-10 w-full max-w-none">
                                <div className="text-[#ff0066] font-semibold mb-1">Mês: 120</div>
                                <div className="space-y-0.5">
                                  <div className="text-gray-300">Parcela do mês: R$ 12.138,949</div>
                                  <div className="text-gray-300">Soma das parcelas: R$ 1.057.190,794</div>
                                  <div className="text-gray-300">Receita do Mês: R$ 25.982,731</div>
                                  <div className="text-gray-300">Receita - Custos: R$ 15.770,074</div>
                                  <div className="text-gray-300">Custos: R$ 10.212,657</div>
                                  <div className="text-gray-300">Renda passiva: R$ 3.631,125</div>
                                  <div className="text-gray-300">Renda passiva acumulada: R$ 236.253,175</div>
                                  <div className="text-gray-300">Fluxo de caixa: R$ 62.304,333</div>
                                  <div className="text-gray-300">Patrimônio: R$ 1.830.833,158</div>
                                  <div className="text-gray-300">Imóveis: 2</div>
                                </div>
                              </div>
                              
                              <svg className="w-full h-full absolute inset-0">
                                {/* Grid lines */}
                                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#333" strokeWidth="1" strokeDasharray="2,2"/>
                                <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#333" strokeWidth="1" strokeDasharray="2,2"/>
                                <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#333" strokeWidth="1" strokeDasharray="2,2"/>
                                <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#333" strokeWidth="1" strokeDasharray="2,2"/>
                                
                                {/* Grey scenario lines */}
                                <path d="M 5% 95% L 95% 85%" stroke="#666" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                <path d="M 5% 95% L 95% 80%" stroke="#666" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                <path d="M 5% 95% L 95% 75%" stroke="#666" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                <path d="M 5% 95% L 95% 70%" stroke="#666" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                <path d="M 5% 95% L 95% 65%" stroke="#666" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                
                                {/* Main pink progress line */}
                                <path
                                  d="M 20 180 L 70 180 L 70 50 L 500 10" 
                                  stroke="#ff0066" 
                                  strokeWidth="3" 
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                
                                {/* Vertical line from house to x-axis */}
                                <line x1="70" y1="50" x2="70" y2="180" stroke="#ff0066" strokeWidth="3"/>
                                
                                {/* House icon at jump point */}
                                <circle cx="70" cy="50" r="7" fill="#ff0066"/>
                                <text x="70" y="45" textAnchor="middle" className="text-xs fill-white" style={{fontSize: '12px'}}>🏠</text>
                                
                                {/* Data point at the end */}
                                <circle cx="500" cy="10" r="6" fill="#ff0066" stroke="white" strokeWidth="2"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interactive Content - Mobile: primeira coluna, Desktop: segunda coluna */}
                    <div className="lg:col-span-2 lg:order-2 order-1 flex flex-col justify-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">Alavancagem Patrimonial</h3>
                          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                            Demonstre como o patrimônio do cliente cresce exponencialmente. Gráficos de evolução patrimonial mostram o poder de multiplicação dos investimentos.
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Evolução patrimonial visual
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Renda passiva acumulada
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Fluxo de caixa projetado
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela Mês a Mês - Desktop Interface */}
            <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 mb-8">
              <div className="w-full">
                <div className="w-full">
                  {/* Desktop and Content Layout */}
                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* Interactive Content */}
                    <div className="lg:col-span-2 flex flex-col justify-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">Tabela Mês a Mês</h3>
                          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                            Detalhamento completo de cada mês da operação. Visualize crédito, parcelas, ágio, lucro e ROI com transparência total para seu cliente.
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Detalhamento mensal completo
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Colunas personalizáveis
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Exportação de dados
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Interface */}
                    <div className="lg:col-span-3 relative overflow-hidden">
                      <div className="bg-[#1A1A1A] rounded-md p-3 space-y-3 overflow-x-auto">
                              {/* Header */}
                              <div className="flex items-center justify-between min-w-max">
                                <div className="text-white text-sm font-semibold">Detalhamento do Consórcio</div>
                                <div className="flex space-x-2">
                                  <div className="w-4 h-4 text-gray-400">👁️</div>
                                  <div className="w-4 h-4 text-gray-400">▼</div>
                                  <div className="w-4 h-4 text-gray-400">⚙️</div>
                                </div>
                              </div>
                              {/* Mobile scroll indicator */}
                              <div className="lg:hidden mb-2">
                                <p className="text-gray-400 text-xs">(role para os lados para ver)</p>
                              </div>
                              
                              {/* Column Toggles */}
                              <div className="text-xs text-gray-400 mb-2">Colunas visíveis:</div>
                              <div className="flex gap-1 mb-3 min-w-max">
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">Mês</span>
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">Crédito</span>
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">Crédito Acessado</span>
                                <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">Taxa de Administração</span>
                                <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">Fundo de Reserva</span>
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">Valor da Parcela</span>
                                <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">Saldo Devedor</span>
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">Ágio</span>
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">Lucro</span>
                                <span className="px-2 py-1 bg-[#e50f5f] text-white rounded text-xs">ROI</span>
                              </div>
                              
                              {/* Table */}
                              <div className="min-w-max">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                      <th className="text-left py-2">Mês</th>
                                      <th className="text-left py-2">Crédito</th>
                                      <th className="text-left py-2">Crédito Acessado</th>
                                      <th className="text-left py-2">Valor da Parcela</th>
                                      <th className="text-left py-2">Ágio</th>
                                      <th className="text-left py-2">Lucro</th>
                                      <th className="text-left py-2">ROI</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-gray-300">
                                    <tr className="border-b border-gray-800">
                                      <td className="py-1">27</td>
                                      <td className="py-1">R$ 1.707.872,00</td>
                                      <td className="py-1">R$ 1.707.872,00</td>
                                      <td className="py-1">R$ 5.620,84</td>
                                      <td className="py-1">R$ 290.338,24</td>
                                      <td className="py-1">R$ 149.813,12</td>
                                      <td className="py-1">106.61%</td>
                                    </tr>
                                    <tr className="border-b border-gray-800">
                                      <td className="py-1">28</td>
                                      <td className="py-1">R$ 1.707.872,00</td>
                                      <td className="py-1">R$ 1.707.872,00</td>
                                      <td className="py-1">R$ 5.620,84</td>
                                      <td className="py-1">R$ 290.338,24</td>
                                      <td className="py-1">R$ 144.192,28</td>
                                      <td className="py-1">98.66%</td>
                                    </tr>
                                    <tr className="border-b border-gray-800 bg-green-900/20">
                                      <td className="py-1">30</td>
                                      <td className="py-1">R$ 1.707.872,00</td>
                                      <td className="py-1">R$ 1.280.904,00</td>
                                      <td className="py-1">R$ 5.620,84</td>
                                      <td className="py-1">R$ 217.753,68</td>
                                      <td className="py-1">R$ 60.366,03</td>
                                      <td className="py-1">38.35%</td>
                                    </tr>
                                    <tr className="border-b border-gray-800">
                                      <td className="py-1">31</td>
                                      <td className="py-1">R$ 1.723.242,85</td>
                                      <td className="py-1">R$ 1.292.432,14</td>
                                      <td className="py-1">R$ 8.280,60</td>
                                      <td className="py-1">R$ 219.713,46</td>
                                      <td className="py-1">R$ 54.045,22</td>
                                      <td className="py-1">32.62%</td>
                                    </tr>
                                    <tr className="border-b border-gray-800">
                                      <td className="py-1">34</td>
                                      <td className="py-1">R$ 1.770.190,41</td>
                                      <td className="py-1">R$ 1.327.642,81</td>
                                      <td className="py-1">R$ 8.280,60</td>
                                      <td className="py-1">R$ 225.699,28</td>
                                      <td className="py-1">R$ 35.189,24</td>
                                      <td className="py-1">18.47%</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações do Simulador - Desktop Interface */}
            <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 mb-8">
              <div className="w-full">
                <div className="w-full">
                  {/* Desktop and Content Layout */}
                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* Desktop Interface - Mobile: segunda coluna, Desktop: primeira coluna */}
                    <div className="lg:col-span-3 lg:order-1 order-2 relative overflow-hidden">
                      <div className="bg-[#1A1A1A] rounded-md p-3 space-y-3 overflow-x-auto">
                              {/* Header */}
                              <div className="space-y-2 min-w-max">
                                <div className="text-white text-lg font-bold">Configurações do Simulador</div>
                                <div className="text-gray-400 text-sm">Gerencie administradoras, produtos, parcelas, alavancas e reduções</div>
                              </div>
                              {/* Mobile scroll indicator */}
                              <div className="lg:hidden mb-2">
                                <p className="text-gray-400 text-xs">(role para os lados para ver)</p>
                              </div>
                              
                              {/* Navigation Tabs */}
                              <div className="flex space-x-1 border-b border-gray-700 min-w-max">
                                <div className="px-3 py-2 bg-[#e50f5f] text-white rounded-t text-sm font-semibold">Administradoras</div>
                                <div className="px-3 py-2 text-gray-400 text-sm">Redução de Parcela</div>
                                <div className="px-3 py-2 text-gray-400 text-sm">Parcelas</div>
                                <div className="px-3 py-2 text-gray-400 text-sm">Produtos</div>
                                <div className="px-3 py-2 text-gray-400 text-sm">Alavancas</div>
                              </div>
                              
                              {/* Administrators Section */}
                              <div className="space-y-3 min-w-max">
                                <div className="text-white text-lg font-bold">Administradoras</div>
                                <div className="text-gray-400 text-sm">Gerencie as administradoras de consórcio</div>
                                
                                {/* Action Bar */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-5 h-5 text-gray-400">📋</div>
                                    <button className="bg-[#e50f5f] text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                                      <span>+</span>
                                      <span>Adicionar Administradora</span>
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Search Bar */}
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 relative">
                                    <input 
                                      type="text" 
                                      placeholder="Buscar administradoras..." 
                                      className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm border border-gray-600"
                                    />
                                    <div className="absolute right-3 top-2 text-gray-400">🔍</div>
                                  </div>
                                  <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm border border-gray-600">
                                    <option>Todas</option>
                                  </select>
                                </div>
                                
                                {/* Table */}
                                <div className="min-w-max">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="text-left py-2">Nome</th>
                                        <th className="text-left py-2">Tipo de Atualização</th>
                                        <th className="text-left py-2">Mês de Atualização</th>
                                        <th className="text-left py-2">% Máx. Embutido</th>
                                        <th className="text-left py-2">Status</th>
                                        <th className="text-left py-2">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-gray-300">
                                      <tr className="border-b border-gray-800">
                                        <td className="py-2 flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                          <span>teste</span>
                                        </td>
                                        <td className="py-2"><span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Anual</span></td>
                                        <td className="py-2">-</td>
                                        <td className="py-2">30%</td>
                                        <td className="py-2"><span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Arquivado</span></td>
                                        <td className="py-2 flex space-x-2">
                                          <div className="w-4 h-4 text-gray-400">✏️</div>
                                          <div className="w-4 h-4 text-gray-400">🗑️</div>
                                        </td>
                                      </tr>
                                      <tr className="border-b border-gray-800">
                                        <td className="py-2 flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                          <span>HS Consórcios</span>
                                        </td>
                                        <td className="py-2"><span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Anual</span></td>
                                        <td className="py-2">-</td>
                                        <td className="py-2">30%</td>
                                        <td className="py-2"><span className="bg-[#e50f5f] text-white px-2 py-1 rounded text-xs">Ativo</span></td>
                                        <td className="py-2 flex space-x-2">
                                          <div className="w-4 h-4 text-gray-400">✏️</div>
                                          <div className="w-4 h-4 text-gray-400">🗑️</div>
                                        </td>
                                      </tr>
                                      <tr className="border-b border-gray-800">
                                        <td className="py-2 flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          <span>Magalu</span>
                                        </td>
                                        <td className="py-2"><span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Mensal</span></td>
                                        <td className="py-2">9</td>
                                        <td className="py-2">30%</td>
                                        <td className="py-2"><span className="bg-[#e50f5f] text-white px-2 py-1 rounded text-xs">Ativo</span></td>
                                        <td className="py-2 flex space-x-2">
                                          <div className="w-4 h-4 text-gray-400">✏️</div>
                                          <div className="w-4 h-4 text-gray-400">🗑️</div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                      </div>
                    </div>
                    
                    {/* Interactive Content - Mobile: primeira coluna, Desktop: segunda coluna */}
                    <div className="lg:col-span-2 lg:order-2 order-1 flex flex-col justify-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">Configurações do Simulador</h3>
                          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                            Controle total sobre administradoras, produtos, parcelas, alavancas e reduções. Personalize o simulador para sua estratégia de vendas.
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Gestão de administradoras
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Configuração de produtos
                          </div>
                          <div className="flex items-center text-base md:text-lg text-gray-400">
                            <span className="mr-3 text-[#e50f5f] text-lg">✓</span>
                            Controle total da estratégia
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-[#e50f5f]/10 to-[#7c032e]/10 rounded-2xl p-6 border border-[#e50f5f]/20">
                              <h3 className="text-3xl font-bold text-white mb-4" style={{ fontSize: '22px', '@media (min-width: 768px)': { fontSize: '26px' } }}>
                Pronto para revolucionar suas vendas?
              </h3>
              <p className="text-base md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Junte-se a milhares de consultores que já multiplicaram seus resultados com o simulador BP Sales
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="px-8 py-4 text-lg font-semibold"
                  style={{ 
                    backgroundColor: defaultBranding?.primary_color || '#e50f5f',
                    color: 'white'
                  }}
                  onClick={() => {
                    const element = document.getElementById('pricing-section');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Ver Planos e Preços
                </Button>
                <Button 
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold border-[#e50f5f] text-[#e50f5f] hover:bg-[#e50f5f] hover:text-white"
                >
                  Solicitar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {showPaymentButton && (
          <div id="pricing-section" className="text-center space-y-12">
            {/* Header Section */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-[32px] font-bold text-white">
                Escolha o plano ideal para seu crescimento
              </h2>
              <p className="text-base md:text-lg text-gray-300">
                Do consultor iniciante ao enterprise, temos a solução perfeita para você
              </p>
            </div>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Plano Mensal - Básico (Esquerda) */}
              <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 hover:border-[#e50f5f]/30 transition-all duration-300 order-1 md:order-1">
                <div className="text-center space-y-4">
                  <h3 className="text-xl md:text-[26px] font-bold text-white">Mensal</h3>
                  <p className="text-base md:text-lg text-gray-300">
                    Perfeito para começar e testar a plataforma
                  </p>
                  <div className="py-4">
                    <div className="text-4xl font-bold text-white">R$ 97</div>
                    <div className="text-sm text-gray-400">por mês</div>
                    <div className="text-xs text-[#e50f5f] mt-1">+ R$ 37 por usuário adicional</div>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso completo ao simulador
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso as configurações do simulador
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Suporte via WhatsApp
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso as Aulas de Fechamento
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    7 dias de Garantia
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Teste 30 dias com quantos usuários quiser
                  </li>
                </ul>

                <Button 
                  className="w-full font-semibold bg-white text-black hover:bg-gray-100"
                  onClick={() => window.open('https://buy.stripe.com/test_9B68wP7rN3ztgidagS6Vq00', '_blank')}
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Começar agora"}
                </Button>
              </div>

              {/* Plano Anual - Intermediário (Meio - Destaque) */}
              <div className="bg-[#1F1F1F] rounded-2xl p-6 border-2 border-[#e50f5f] relative hover:border-[#e50f5f]/80 transition-all duration-300 order-3 md:order-2">
                {/* Etiqueta Popular */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#e50f5f] text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Popular
                  </span>
                </div>

                <div className="text-center space-y-4">
                  <h3 className="text-xl md:text-[26px] font-bold text-white">Anual</h3>
                  <p className="text-base md:text-lg text-gray-300">
                    Economia de 50% e suporte premium
                  </p>
                  <div className="py-4">
                    <div className="text-4xl font-bold text-white">R$ 582</div>
                    <div className="text-sm text-gray-400">por 12 meses</div>
                    <div className="text-xs text-[#e50f5f] mt-1">+ R$ 197 por usuário adicional</div>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso completo ao simulador
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso as configurações do simulador
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Suporte via WhatsApp
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso as Aulas de Fechamento
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    7 dias de Garantia
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso antecipado a novas atualizações
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Teste 30 dias com quantos usuários quiser
                  </li>
                </ul>

                <Button 
                  className="w-full font-semibold"
                  style={{ 
                    backgroundColor: defaultBranding?.primary_color || '#e50f5f',
                    color: 'white'
                  }}
                  onClick={() => window.open('https://buy.stripe.com/test_4gMcN5aDZ7PJ3vr1Km6Vq01', '_blank')}
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Escolher anual"}
                </Button>
              </div>

              {/* Plano Semestral - Enterprise (Direita) */}
              <div className="bg-[#1F1F1F] rounded-2xl p-6 border border-white/10 hover:border-[#e50f5f]/30 transition-all duration-300 order-2 md:order-3">
                <div className="text-center space-y-4">
                  <h3 className="text-xl md:text-[26px] font-bold text-white">Semestral</h3>
                  <p className="text-base md:text-lg text-gray-300">
                    Economia de 17% e suporte premium
                  </p>
                  <div className="py-4">
                    <div className="text-4xl font-bold text-white">R$ 485</div>
                    <div className="text-sm text-gray-400">por 6 meses</div>
                    <div className="text-xs text-[#e50f5f] mt-1">+ R$ 162 por usuário adicional</div>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso completo ao simulador
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso as configurações do simulador
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Suporte via WhatsApp
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Acesso as Aulas de Fechamento
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    7 dias de Garantia
                  </li>
                  <li className="flex items-center text-gray-300 text-sm">
                    <span className="mr-3 text-[#e50f5f]">✓</span>
                    Teste 30 dias com quantos usuários quiser
                  </li>
                </ul>

                <Button 
                  className="w-full font-semibold bg-white text-black hover:bg-gray-100"
                  onClick={() => window.open('https://buy.stripe.com/test_7sY28raDZ0nh4zvcp06Vq02', '_blank')}
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Escolher semestral"}
                </Button>
              </div>
            </div>

            {/* Garantia e ROI Section */}
            <div className="mt-16 space-y-12">
              {/* Garantia Section */}
              <div className="text-center">
                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
                    {/* Shield Visual */}
                    <div className="flex-shrink-0">
                      <img 
                        src="/BP Sales - Garantia.png" 
                        alt="BP Sales - Garantia de 7 Dias" 
                        className="w-40 h-48 object-contain"
                      />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 max-w-2xl text-center lg:text-left">
                      <h3 className="text-2xl md:text-[32px] font-bold text-white mb-4">
                        Garantia de 7 Dias
                      </h3>
                      <p className="text-lg md:text-xl text-gray-300 mb-6">
                        Se em até 7 dias você não estiver 100% satisfeito, devolvemos todo seu dinheiro. Sem perguntas, sem burocracia.
                      </p>
                      <div className="flex items-center justify-center space-x-6 text-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">7</div>
                          <div className="text-sm text-gray-400">Dias</div>
                        </div>
                        <div className="text-3xl text-gray-600">→</div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">0</div>
                          <div className="text-sm text-gray-400">Perguntas</div>
                        </div>
                        <div className="text-3xl text-gray-600">→</div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">100%</div>
                          <div className="text-sm text-gray-400">Devolução</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
                            {/* ROI Section */}
              <div className="text-center p-8">
                <h3 className="text-2xl md:text-[32px] font-bold text-white mb-4">
                  Recupere o Investimento com Apenas 1 Venda
                </h3>
                <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto mb-8">
                  Mesmo com comissionamento de apenas 1%, uma única venda de crédito de R$ 100.000 já recupera quase o dobro do investimento anual.
                </p>
                
                <div className="bg-[#1F1F1F] rounded-xl p-6 max-w-3xl mx-auto mb-8">
                  <h4 className="text-xl font-bold text-white mb-4">💡 Por que não faz sentido não usar?</h4>
                  <div className="text-left space-y-3 text-gray-300">
                    <div className="flex items-start space-x-3">
                      <span className="text-[#e50f5f] text-lg">✓</span>
                      <span className="text-base md:text-xl">Você tem <strong className="text-white">7 dias de garantia</strong> para testar sem risco</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-[#e50f5f] text-lg">✓</span>
                      <span className="text-base md:text-xl">Com apenas <strong className="text-white">1 venda de R$ 100.000</strong> você já recupera o investimento</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-[#e50f5f] text-lg">✓</span>
                      <span className="text-base md:text-xl">O simulador <strong className="text-white">aumenta suas chances de fechamento</strong> significativamente</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-[#e50f5f] text-lg">✓</span>
                      <span className="text-base md:text-xl">Se não funcionar, você <strong className="text-white">não perde nada</strong> - devolvemos 100%</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-[#1F1F1F] rounded-xl p-6">
                    <div className="text-2xl font-bold text-green-400 mb-2">R$ 1.000</div>
                    <div className="text-sm text-gray-400">Comissão (1% de R$ 100k)</div>
                  </div>
                  <div className="bg-[#1F1F1F] rounded-xl p-6">
                    <div className="text-2xl font-bold text-green-400 mb-2">R$ 418</div>
                    <div className="text-sm text-gray-400">Lucro Imediato</div>
                  </div>
                  <div className="bg-[#1F1F1F] rounded-xl p-6">
                    <div className="text-2xl font-bold text-white mb-2">+72%</div>
                    <div className="text-sm text-gray-400">Retorno Imediato</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-[32px] font-bold text-white mb-4">
                  Perguntas Frequentes
                </h2>
                <p className="text-base md:text-xl text-gray-300">
                  Tire suas dúvidas sobre a plataforma BP Sales
                </p>
              </div>

              <div className="space-y-4">
                {/* FAQ Item 1 */}
                <div className="bg-[#1F1F1F] rounded-xl border border-white/10">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2A2A2A] transition-colors duration-200"
                    onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                  >
                    <span className="text-white font-bold text-base md:text-xl">
                      Porque a plataforma cobra um valor tão baixo pelo simulador?
                    </span>
                    <span className={`text-[#e50f5f] text-xl transition-transform duration-200 ${openFaq === 1 ? 'rotate-45' : ''}`}>
                      {openFaq === 1 ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === 1 && (
                    <div className="px-6 pb-4 text-left">
                      <p className="text-gray-300 text-base md:text-xl leading-relaxed">
                        Nosso objetivo inicialmente é ganhar mercado e não ser a empresa que mais lucra inicialmente, mas com certeza com o crescimento da plataforma e com o lançamento das funcionalidades teremos atualização de valores para novos usuários, mas o valor será o mesmo da contratação enquanto permanecer com a sua assinatura ativa.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ Item 2 */}
                <div className="bg-[#1F1F1F] rounded-xl border border-white/10">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2A2A2A] transition-colors duration-200"
                    onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                  >
                    <span className="text-white font-bold text-base md:text-xl">
                      Como vou aprender a usar a plataforma?
                    </span>
                    <span className={`text-[#e50f5f] text-xl transition-transform duration-200 ${openFaq === 2 ? 'rotate-45' : ''}`}>
                      {openFaq === 2 ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === 2 && (
                    <div className="px-6 pb-4 text-left">
                      <p className="text-gray-300 text-base md:text-xl leading-relaxed">
                        A plataforma foi construída com princípios de experiência do usuário, buscando ser o mais intuitiva o possível e como se isso não fosse o suficiente, criamos algumas video aulas ensinando a usar cada etapa do simulador.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ Item 3 */}
                <div className="bg-[#1F1F1F] rounded-xl border border-white/10">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2A2A2A] transition-colors duration-200"
                    onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                  >
                    <span className="text-white font-bold text-base md:text-xl">
                      Consigo cadastrar as informações da administradora que eu comercializo?
                    </span>
                    <span className={`text-[#e50f5f] text-xl transition-transform duration-200 ${openFaq === 3 ? 'rotate-45' : ''}`}>
                      {openFaq === 3 ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === 3 && (
                    <div className="px-6 pb-4 text-left">
                      <p className="text-gray-300 text-base md:text-xl leading-relaxed">
                        Claro, a plataforma foi construída para que você possa personalizar o simulador com as regras que você acordou com a sua administradora. Temos uma página só de configurações onde você cadastra as informações uma única vez, e tanto você quanto a sua equipe podem sempre utilizar.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ Item 4 */}
                <div className="bg-[#1F1F1F] rounded-xl border border-white/10">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2A2A2A] transition-colors duration-200"
                    onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
                  >
                    <span className="text-white font-bold text-base md:text-xl">
                      Funciona mesmo para quem é novato na venda de consórcio?
                    </span>
                    <span className={`text-[#e50f5f] text-xl transition-transform duration-200 ${openFaq === 4 ? 'rotate-45' : ''}`}>
                      {openFaq === 4 ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === 4 && (
                    <div className="px-6 pb-4 text-left">
                      <p className="text-gray-300 text-base md:text-xl leading-relaxed">
                        Sim, mas não é ideal para quem ainda não sabe nada sobre consórcio, é recomendável que você tenha um conhecimento base adequado até para ter condições de apresentar as estratégias que o simulador apresenta.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ Item 5 */}
                <div className="bg-[#1F1F1F] rounded-xl border border-white/10">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2A2A2A] transition-colors duration-200"
                    onClick={() => setOpenFaq(openFaq === 5 ? null : 5)}
                  >
                    <span className="text-white font-bold text-base md:text-xl">
                      Posso cancelar quando quiser?
                    </span>
                    <span className={`text-[#e50f5f] text-xl transition-transform duration-200 ${openFaq === 5 ? 'rotate-45' : ''}`}>
                      {openFaq === 5 ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === 5 && (
                    <div className="px-6 pb-4 text-left">
                      <p className="text-gray-300 text-base md:text-xl leading-relaxed">
                        Sim, ao final do seu plano você pode simplesmente acessar o seu perfil e facilmente cancelar o seu plano.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ Item 6 */}
                <div className="bg-[#1F1F1F] rounded-xl border border-white/10">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2A2A2A] transition-colors duration-200"
                    onClick={() => setOpenFaq(openFaq === 6 ? null : 6)}
                  >
                    <span className="text-white font-bold text-base md:text-xl">
                      Em quanto tempo vou ver resultado?
                    </span>
                    <span className={`text-[#e50f5f] text-xl transition-transform duration-200 ${openFaq === 6 ? 'rotate-45' : ''}`}>
                      {openFaq === 6 ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === 6 && (
                    <div className="px-6 pb-4 text-left">
                      <p className="text-gray-300 text-base md:text-xl leading-relaxed">
                        Depende da sua maturidade em vendas de consórcio e do seu funil atual, se o seu funil está cheio e você vai atender clientes logo você poderá ter resultados imediatos. Você pode esperar tanto aumento nas conversões quanto aumento no ticket.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* WhatsApp Section */}
            <div className="max-w-4xl mx-auto mb-20 text-center">
              <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10">
                <h3 className="text-xl md:text-[26px] font-bold text-white mb-4">
                  Ainda tem dúvidas? Nos chame no WhatsApp
                </h3>
                <p className="text-base md:text-xl text-gray-300 mb-6">
                  Nossa equipe está pronta para te ajudar com qualquer dúvida sobre o simulador
                </p>
                <Button 
                  onClick={() => setShowWhatsAppModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-all duration-300 text-base md:text-lg flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>Falar no WhatsApp</span>
                </Button>
              </div>
            </div>

            </div>
          )}
      </div>

      {/* Barra Promocional Fixa */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#e50f5f] to-[#7c032e] border-t border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="text-center sm:text-left">
              <p className="text-white font-bold text-sm sm:text-base md:text-lg">
                🎉 Aproveite a promoção de lançamento com 50% de desconto
              </p>
                      <p className="text-white/80 text-xs sm:text-sm hidden sm:block">
                Oferta limitada - Garante já o seu acesso anual!
              </p>
            </div>
            <Button 
              onClick={handlePayment}
              disabled={loading}
              className="bg-white text-[#e50f5f] hover:bg-gray-100 font-bold px-4 py-2 sm:px-6 sm:py-2 md:px-8 md:py-3 rounded-lg shadow-lg transition-all duration-300 whitespace-nowrap text-xs sm:text-sm md:text-base"
            >
              {loading ? "Processando..." : "Assinar Anual"}
            </Button>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F1F1F] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Falar no WhatsApp
              </h3>
              <p className="text-gray-300 text-sm">
                Preencha seus dados para iniciar a conversa
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nome e Sobrenome
                </label>
                <input
                  type="text"
                  value={whatsappForm.name}
                  onChange={(e) => setWhatsappForm({...whatsappForm, name: e.target.value})}
                  className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#e50f5f]"
                  placeholder="Digite seu nome completo"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={whatsappForm.phone}
                  onChange={(e) => setWhatsappForm({...whatsappForm, phone: e.target.value})}
                  className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#e50f5f]"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleWhatsAppSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}