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
            De o play no vídeo e veja como uma simples simulação pode deixar seu cliente sem saídas racionais
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
              className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 hover:border-[#e50f5f]/50 hover:shadow-lg hover:shadow-[#e50f5f]/20 transition-all duration-300 group"
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
                          <button className="bg-green-600 text-white text-xs px-3 py-2 rounded flex-1">Gerar proposta</button>
                          <button className="bg-black text-white text-xs px-3 py-2 rounded">Redefinir</button>
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
              className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 hover:border-[#e50f5f]/50 hover:shadow-lg hover:shadow-[#e50f5f]/20 transition-all duration-300 group"
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
                       <div className="bg-[#1A1A1A] rounded-md p-3 space-y-3 overflow-x-auto">
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
                               <div className="bg-[#2A2A2A] rounded p-3 min-w-max">
                                 <div className="flex items-center justify-between mb-2">
                                   <span className="text-white text-sm font-semibold">Evolução do Lucro por Mês</span>
                                   <div className="w-4 h-4 text-[#e50f5f]">⚙️</div>
                                 </div>
                                 <div className="overflow-x-auto lg:overflow-x-visible">
                                   <div className="min-w-[980px] h-32 bg-[#1A1A1A] rounded p-2">
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
            <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 mb-8">
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
                          {/* Desktop: 4 colunas, Mobile: 2 colunas */}
                          <div className="grid grid-cols-4 lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 gap-2">
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Patrimônio na Contemplação</div>
                              <div className="text-white text-sm font-bold">R$ 1.200.000,00</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Parcela Pós-Contemplação</div>
                              <div className="text-white text-sm font-bold">R$ 8.280,60</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Ganhos Mensais</div>
                              <div className="text-white text-sm font-bold">R$ 10.488,00</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Fluxo de Caixa</div>
                              <div className="text-white text-sm font-bold">R$ 2.207,40</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Patrimônio final</div>
                              <div className="text-white text-sm font-bold">R$ 3.247.056</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Renda passiva</div>
                              <div className="text-white text-sm font-bold">R$ 28.379,27</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
                              <div className="text-[#e50f5f] text-xs font-semibold">Investimento</div>
                              <div className="text-white text-sm font-bold">14,67%</div>
                            </div>
                            <div className="bg-[#2A2A2A] rounded p-2">
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
                          <div className="h-36 bg-[#1A1A1A] rounded p-4 relative">
                            {/* Chart SVG */}
                            <div className="relative h-full">
                              {/* Tooltip with financial data */}
                              <div className="absolute -top-2 right-24 bg-[#2A2A2A] rounded-lg p-2 text-xs border border-white/20 shadow-lg z-10 max-w-xs">
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
            <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 mb-8">
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
            <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 mb-8">
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
            <div className="bg-gradient-to-r from-[#e50f5f]/10 to-[#7c032e]/10 rounded-2xl p-8 border border-[#e50f5f]/20">
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
              <h2 className="text-3xl font-bold text-white" style={{ fontSize: '26px', '@media (min-width: 768px)': { fontSize: '32px' } }}>
                Escolha o plano ideal para seu crescimento
              </h2>
              <p className="text-base md:text-lg text-gray-300">
                Do consultor iniciante ao enterprise, temos a solução perfeita para você
              </p>
            </div>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Plano Mensal - Básico (Esquerda) */}
              <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 hover:border-[#e50f5f]/30 transition-all duration-300">
                <div className="text-center space-y-4">
                  <h3 className="text-xl md:text-[26px] font-bold text-white">Mensal</h3>
                  <p className="text-base md:text-lg text-gray-300">
                    Perfeito para começar e testar a plataforma
                  </p>
                  <div className="py-4">
                    <div className="text-4xl font-bold text-white">R$ 97</div>
                    <div className="text-sm text-gray-400">por mês</div>
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
              <div className="bg-[#1F1F1F] rounded-2xl p-8 border-2 border-[#e50f5f] relative hover:border-[#e50f5f]/80 transition-all duration-300">
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
                    <div className="text-xs text-[#e50f5f] mt-1">Economia de R$ 582</div>
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
              <div className="bg-[#1F1F1F] rounded-2xl p-8 border border-white/10 hover:border-[#e50f5f]/30 transition-all duration-300">
                <div className="text-center space-y-4">
                  <h3 className="text-xl md:text-[26px] font-bold text-white">Semestral</h3>
                  <p className="text-base md:text-lg text-gray-300">
                    Economia de 17% e suporte premium
                  </p>
                  <div className="py-4">
                    <div className="text-4xl font-bold text-white">R$ 485</div>
                    <div className="text-sm text-gray-400">por 6 meses</div>
                    <div className="text-xs text-[#e50f5f] mt-1">Economia de R$ 97</div>
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

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e50f5f]/20 to-[#e50f5f]/10 rounded-lg mx-auto flex items-center justify-center shadow-sm border border-[#e50f5f]/20">
                  <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: defaultBranding?.primary_color || '#e50f5f' }}></div>
                </div>
                <h3 className="font-semibold text-white" style={{ fontSize: '22px', '@media (min-width: 768px)': { fontSize: '26px' } }}>Proteção patrimonial</h3>
                <p className="text-sm text-gray-300">
                  Simule diferentes cenários de proteção para seus clientes
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e50f5f]/20 to-[#e50f5f]/10 rounded-lg mx-auto flex items-center justify-center shadow-sm border border-[#e50f5f]/20">
                  <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: defaultBranding?.primary_color || '#e50f5f' }}></div>
                </div>
                <h3 className="font-semibold text-white" style={{ fontSize: '22px', '@media (min-width: 768px)': { fontSize: '26px' } }}>Fluxo de caixa positivo</h3>
                <p className="text-sm text-gray-300">
                  Mantenha seu dinheiro trabalhando enquanto aguarda a contemplação
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e50f5f]/20 to-[#e50f5f]/10 rounded-lg mx-auto flex items-center justify-center shadow-sm border border-[#e50f5f]/20">
                  <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: defaultBranding?.primary_color || '#e50f5f' }}></div>
                </div>
                <h3 className="font-semibold text-white" style={{ fontSize: '22px', '@media (min-width: 768px)': { fontSize: '26px' } }}>17+ anos de experiência</h3>
                <p className="text-sm text-gray-300">
                  Metodologia testada e aprovada por milhares de consultores
                </p>
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
    </div>
  );
}