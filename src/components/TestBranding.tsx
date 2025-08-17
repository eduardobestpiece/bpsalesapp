import { useDefaultBranding } from '@/hooks/useDefaultBranding';

export const TestBranding = () => {
  const { branding, isLoading, error } = useDefaultBranding();

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h3 className="font-bold mb-2">🔍 Teste do Branding da BP Sales</h3>
      <div className="text-sm space-y-1">
        <div><strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}</div>
        <div><strong>Erro:</strong> {error ? error.message : 'Nenhum'}</div>
        <div><strong>Branding:</strong> {branding ? 'Carregado' : 'Não carregado'}</div>
        {branding && (
          <>
            <div><strong>Logo Light:</strong> {branding.logo_horizontal_url || 'N/A'}</div>
            <div><strong>Logo Dark:</strong> {branding.logo_horizontal_dark_url || 'N/A'}</div>
            <div><strong>Cor Primária:</strong> {branding.primary_color || 'N/A'}</div>
          </>
        )}
      </div>
    </div>
  );
}; 