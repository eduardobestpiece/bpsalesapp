import { useNavigate } from 'react-router-dom';
import { Search, Instagram, Bot } from 'lucide-react';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';
import { ProspeccaoLayout } from '@/components/Layout/ProspeccaoLayout';

export default function ProspeccaoIndex() {
  const navigate = useNavigate();
  const { branding: defaultBranding } = useDefaultBranding();

  return (
    <ProspeccaoLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] p-4">
        <h1 className="text-[28px] md:text-[44px] font-bold text-white mb-4 text-center">
          Módulo de Prospecção
        </h1>
        
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          {/* Google Scrapper */}
          <button
            onClick={() => navigate('/prospeccao/google')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Search className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Google Scrapper</span>
              <span className="text-gray-300 text-sm">Extraia dados de pesquisas do Google com filtros avançados.</span>
            </div>
          </button>
          
          {/* Instagram Scrapper */}
          <button
            onClick={() => navigate('/prospeccao/instagram')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Instagram className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">Instagram Scrapper</span>
              <span className="text-gray-300 text-sm">Extraia informações de perfis do Instagram.</span>
            </div>
          </button>
          
          {/* IA Scrapper */}
          <button
            onClick={() => navigate('/prospeccao/ia')}
            className="w-full bg-[#1F1F1F] rounded-2xl shadow-xl p-6 flex items-center hover:bg-[#161616] transition border border-white/10 group focus:outline-none focus:ring-2 focus:ring-[#e50f5f]/50"
          >
            <Bot className="h-12 w-12 mr-6 group-hover:scale-110 transition" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <div className="flex-1 text-left">
              <span className="text-xl font-semibold text-white block mb-1">IA Scrapper</span>
              <span className="text-gray-300 text-sm">Extração inteligente com IA.</span>
            </div>
          </button>
        </div>
      </div>
    </ProspeccaoLayout>
  );
}
