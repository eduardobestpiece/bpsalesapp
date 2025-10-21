import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Play, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { useDefaultBranding } from "@/hooks/useDefaultBranding";
import { useGlobalColors } from "@/hooks/useGlobalColors";
import { LandingPhoneInput } from "@/components/ui/LandingPhoneInput";
import { useUserInfo } from "@/hooks/useUserInfo";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LandingTeste() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    phoneDdi: "55",
    phoneCountryCode: "BR",
    phoneCountryName: "Brasil",
    invests: "",
    monthlyInvestment: "",
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
    fbc: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { branding: defaultBranding, isLoading: brandingLoading } = useDefaultBranding();
  const { globalDefaultColor } = useGlobalColors();
  const userInfo = useUserInfo();

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...userInfo,
    }));
  }, [userInfo]);

  const toTitleCase = (text: string) => text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const getFirstName = (full: string) => toTitleCase(full.trim().split(/\s+/)[0] || "");
  const getLastName = (full: string) => {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    return toTitleCase(parts.slice(1).join(" "));
  };

  const normalizePhoneNumbers = (rawPhone: string, ddi: string) => {
    const justDigits = rawPhone.replace(/\D/g, "");
    const ddiDigits = (ddi || "").replace(/\D/g, "");
    let phoneWithoutDdi = justDigits;
    if (ddiDigits && justDigits.startsWith(ddiDigits)) {
      phoneWithoutDdi = justDigits.slice(ddiDigits.length);
    }
    return {
      full: `${ddiDigits}${phoneWithoutDdi}`,
      ddi: ddiDigits,
      local: phoneWithoutDdi,
    };
  };

  const fetchCountryByIp = async (ip: string): Promise<string> => {
    try {
      if (!ip) return "";
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await res.json();
      return data?.country_name || "";
    } catch {
      return "";
    }
  };

  const sha256 = async (value: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value || "");
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const loadFbqOnce = () => {
    if ((window as any).fbq) return;
    (function(f:any,b:any,e:any,v:any,n?:any,t?:any,s?:any){
      if(f.fbq)return; n=f.fbq=function(){ n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments) }; if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[]; t=b.createElement(e); t.async=!0; t.src=v; s=b.getElementsByTagName(e)[0]; s.parentNode?.insertBefore(t,s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  };

  const fireMetaPixels = async (advanced: { firstName: string; lastName: string; email: string; phoneFull: string; country: string; eventId: string; eventSourceUrl: string; ip: string; ua: string; fbp?: string; fbc?: string; investe: string; aporte: string; }) => {
    const pixels = [
      { id: '283575840992045', token: 'EAAVZApIpVEiIBPY6RAlB2WOp1tNouhFLcDL4oGa4lDAZCJvBEkCy6pFdVhuJqcZAht4kLJT0qJEUYCHGEUV6HPsdAZCt9xd6bXkxdTSfnoogRaMuJonbMFEmoNTgip9tbnvvsB1kzwZCLTZAdRiLKbVZCqnSh9NCmDaM9ZAMHrroyeGJd5FLmaQYpGiO1Q6LztgQEQZDZD', test: 'TEST54855' },
      { id: '1890417031518550', token: 'EAAVZApIpVEiIBPY6RAlB2WOp1tNouhFLcDL4oGa4lDAZCJvBEkCy6pFdVhuJqcZAht4kLJT0qJEUYCHGEUV6HPsdAZCt9xd6bXkxdTSfnoogRaMuJonbMFEmoNTgip9tbnvvsB1kzwZCLTZAdRiLKbVZCqnSh9NCmDaM9ZAMHrroyeGJd5FLmaQYpGiO1Q6LztgQEQZDZD', test: 'TEST24318' },
    ];

    loadFbqOnce();

    for (const p of pixels) {
      try {
        // Browser Pixel com Advanced Matching + dedupe
        (window as any).fbq('init', p.id, {
          em: advanced.email,
          fn: advanced.firstName.toLowerCase(),
          ln: advanced.lastName.toLowerCase(),
          ph: advanced.phoneFull,
          country: (advanced.country || '').toLowerCase(),
          external_id: advanced.eventId,
        });
        (window as any).fbq('track', 'Lead', {
          content_name: 'Formulario de Investidores',
          investe: advanced.investe,
          aporte: advanced.aporte,
        }, { eventID: advanced.eventId });

        // Conversions API (CAPI)
        const user_data = {
          em: await sha256(advanced.email),
          ph: await sha256(advanced.phoneFull),
          fn: await sha256(advanced.firstName.toLowerCase()),
          ln: await sha256(advanced.lastName.toLowerCase()),
          country: await sha256((advanced.country || '').toLowerCase()),
          external_id: await sha256(advanced.eventId),
          client_ip_address: advanced.ip,
          client_user_agent: advanced.ua,
          fbp: advanced.fbp || undefined,
          fbc: advanced.fbc || undefined,
        } as any;

        const capiPayload = {
          data: [
            {
              event_name: 'Lead',
              event_time: Math.floor(Date.now() / 1000),
              event_id: advanced.eventId,
              event_source_url: advanced.eventSourceUrl,
              action_source: 'website',
              user_data,
              custom_data: {
                form_name: 'Formulario de Investidores',
                investe: advanced.investe,
                aporte: advanced.aporte,
              },
            },
          ],
          test_event_code: p.test,
        };

        fetch(`https://graph.facebook.com/v18.0/${p.id}/events?access_token=${encodeURIComponent(p.token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capiPayload),
        }).catch(() => {});
      } catch (err) {
        console.error('Erro ao disparar Meta Pixel', err);
      }
    }
  };

  const loadGtagOnce = () => {
    const id = 'AW-327587117';
    if ((window as any).gtag) return;
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(gtagScript);
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(){ (window as any).dataLayer.push(arguments); }
    (window as any).gtag = gtag;
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', id);
  };

  const fireGoogleAds = (email: string, phone: string, firstName: string, lastName: string, country: string) => {
    loadGtagOnce();
    const send_to = 'AW-327587117/QAS5CNShopwbEK2qmpwB';
    (window as any).gtag('set', 'user_data', {
      email: email,
      phone_number: phone,
      first_name: firstName.toLowerCase(),
      last_name: lastName.toLowerCase(),
      address: { country: (country || '').toLowerCase() },
    });
    (window as any).gtag('event', 'conversion', { send_to, value: 1.0, currency: 'BRL' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else {
      const parts = formData.name.trim().split(" ").filter(p => p.length > 0);
      if (parts.length < 2) {
        newErrors.name = "Digite seu primeiro nome e pelo menos um sobrenome";
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Digite um e-mail válido";
    }

    const phoneNumbers = (formData.phone || "").replace(/\D/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (phoneNumbers.length < 10) {
      newErrors.phone = "Digite um telefone válido";
    }

    if (!formData.monthlyInvestment) {
      newErrors.monthlyInvestment = "Selecione uma faixa de investimento";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (formData.monthlyInvestment === "400-1000") {
      toast.error("No momento estamos atendendo perfis a partir de R$ 1.000,00 por mês.");
      return;
    }

    // Preparar dados normalizados
    const firstName = getFirstName(formData.name);
    const lastName = getLastName(formData.name);
    const fullName = toTitleCase(formData.name);
    const emailLower = formData.email.trim().toLowerCase();
    const { full: phoneFull, ddi, local } = normalizePhoneNumbers(formData.phone, formData.phoneDdi);

    // Obter país pelo IP
    const countryByIp = await fetchCountryByIp(formData.ip);

    // Payload para o webhook
    const payload = {
      primeiro_nome: firstName,
      sobrenome: lastName,
      nome_completo: fullName,
      email: emailLower,
      telefone: phoneFull,
      DDI: ddi,
      telefone_sem_ddd: local,
      pais: countryByIp,
      investe: formData.invests,
      aporte: formData.monthlyInvestment,
      form_name: "Formulario de Investidores",
      full_url: formData.fullUrl,
      urlWithoutParams: formData.urlWithoutParams,
      urlParams: formData.urlParams,
      utm_campaign: formData.utm_campaign,
      utm_medium: formData.utm_medium,
      utm_content: formData.utm_content,
      utm_source: formData.utm_source,
      utm_term: formData.utm_term,
      gclid: formData.gclid,
      fbclid: formData.fbclid,
      fbp: formData.fbp,
      fbc: formData.fbc,
      ip: formData.ip,
      browser: formData.browser,
      device: formData.device,
    };

    try {
      await fetch("https://n8n-n8n-start.1u8ncb.easypanel.host/webhook/4aa6dbaa-0f86-4cfc-8651-aaa34a300a90", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // não bloquear o fluxo se o webhook falhar
      console.error("Falha ao enviar webhook", err);
    }

    // Disparo de Pixels (Meta + Google) com deduplicação
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await fireMetaPixels({
      firstName,
      lastName,
      email: emailLower,
      phoneFull,
      country: countryByIp,
      eventId,
      eventSourceUrl: formData.fullUrl || window.location.href,
      ip: formData.ip,
      ua: navigator.userAgent,
      fbp: formData.fbp,
      fbc: formData.fbc,
      investe: formData.invests,
      aporte: formData.monthlyInvestment,
    });

    fireGoogleAds(emailLower, phoneFull, firstName, lastName, countryByIp);

    localStorage.setItem("leadData", JSON.stringify(formData));
    setTimeout(() => {
      window.location.href = "https://monteo.com.br/cadastroconfirmado-i/";
    }, 700);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phone: value,
    }));

    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: "",
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
                      className={`h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-page-input font-[Effra] ${
                        errors.name ? 'border-red-500 focus:border-red-500' : ''
                      } focus:border-[#E50F5E]`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                  </div>

                  {/* E-mail */}
                  <div className="space-y-2">
                    <Input
                      name="email"
                      type="email"
                      placeholder="E-mail"
                      value={formData.email}
                      onChange={handleChange}
                      className={`h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 text-white placeholder:text-gray-400 focus:ring-white/20 landing-page-input font-[Effra] ${
                        errors.email ? 'border-red-500 focus:border-red-500' : ''
                      } focus:border-[#E50F5E]`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">{errors.email}</p>
                    )}
                  </div>

                  {/* Telefone com WhatsApp */}
                  <div className="space-y-2">
                    <LandingPhoneInput
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="Telefone (WhatsApp)"
                      error={errors.phone}
                      globalDefaultColor={globalDefaultColor}
                      accentFocus
                      onDdiChange={(ddi) => setFormData(prev => ({ ...prev, phoneDdi: ddi }))}
                    />
                  </div>

                  {/* Você já investe? (Sim / Não) */}
                  <div className="space-y-2">
                    <label className="text-base md:text-lg text-white/90 font-[Effra]">Você já investe?</label>
                    <ToggleGroup
                      type="single"
                      value={formData.invests}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, invests: val || "" }))}
                      className="grid grid-cols-2 gap-3"
                    >
                      <ToggleGroupItem
                        value="sim"
                        aria-label="Sim"
                        className={`font-normal text-[#9BA3AF] bg-[#2A2A2A] border border-white/20 rounded-md px-4 py-3 hover:bg-[#81503b] hover:text-white transition-colors data-[state=on]:bg-[#a86f57] data-[state=on]:text-white text-base md:text-lg font-[Effra]`}
                      >
                        Sim
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="nao"
                        aria-label="Não"
                        className={`font-normal text-[#9BA3AF] bg-[#2A2A2A] border border-white/20 rounded-md px-4 py-3 hover:bg-[#81503b] hover:text-white transition-colors data-[state=on]:bg-[#a86f57] data-[state=on]:text-white text-base md:text-lg font-[Effra]`}
                      >
                        Não
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {/* Quanto poderia investir mensalmente hoje? */}
                  <div className="space-y-3">
                    <Select
                      value={formData.monthlyInvestment}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, monthlyInvestment: value }));
                        if (errors.monthlyInvestment) {
                          setErrors(prev => ({ ...prev, monthlyInvestment: "" }));
                        }
                      }}
                    >
                                             <SelectTrigger className={`${!formData.monthlyInvestment ? 'text-[#9BA3AF]' : 'text-white'} h-12 text-base md:text-lg bg-[#2A2A2A] border-white/20 focus:ring-white/20 landing-page-input font-[Effra] focus:border-[#a86f57]`}>
                         <SelectValue placeholder="Quanto poderia investir mensalmente hoje?" />
                      </SelectTrigger>
                                             <SelectContent className="bg-[#2A2A2A] border-white/20 text-white">
                         <SelectItem value="400-1000" className="text-base md:text-lg hover:bg-[#a86f57] data-[highlighted]:bg-[#a86f57] data-[highlighted]:text-white data-[state=checked]:bg-[#a86f57] data-[state=checked]:text-white">
                           Entre R$ 400 e R$ 1.000,00
                         </SelectItem>
                         <SelectItem value="1000-2500" className="text-base md:text-lg hover:bg-[#a86f57] data-[highlighted]:bg-[#a86f57] data-[highlighted]:text-white data-[state=checked]:bg-[#a86f57] data-[state=checked]:text-white">
                           De R$ 1.000,00 a 2.500,00
                         </SelectItem>
                         <SelectItem value="2500-5000" className="text-base md:text-lg hover:bg-[#a86f57] data-[highlighted]:bg-[#a86f57] data-[highlighted]:text-white data-[state=checked]:bg-[#a86f57] data-[state=checked]:text-white">
                           De R$ 2.500,00 a R$ 5.000,00
                         </SelectItem>
                         <SelectItem value="5000+" className="text-base md:text-lg hover:bg-[#a86f57] data-[highlighted]:bg-[#a86f57] data-[highlighted]:text-white data-[state=checked]:bg-[#a86f57] data-[state=checked]:text-white">
                           Acima de R$ 5.000,00
                         </SelectItem>
                       </SelectContent>
                    </Select>

                    {errors.monthlyInvestment && (
                      <p className="text-red-500 text-sm">{errors.monthlyInvestment}</p>
                    )}
                  </div>

                  {/* Botão de Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base md:text-lg font-semibold bg-gradient-to-r from-[#a86f57] to-[#81503b] hover:opacity-90 transition-all duration-300 shadow-lg text-white"
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