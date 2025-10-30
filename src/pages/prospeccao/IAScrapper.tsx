import { ProspeccaoLayout } from '@/components/Layout/ProspeccaoLayout';
import { Bot } from 'lucide-react';

export default function IAScrapper() {
  return (
    <ProspeccaoLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">IA Scrapper</h1>
          <p className="text-muted-foreground mt-2">
            Extração inteligente com IA para análise avançada de dados.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
          <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Em Desenvolvimento</h3>
          <p className="text-muted-foreground text-center max-w-md">
            O módulo de IA Scrapper está sendo desenvolvido e estará disponível em breve.
          </p>
        </div>
      </div>
    </ProspeccaoLayout>
  );
}
