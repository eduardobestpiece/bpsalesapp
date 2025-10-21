import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GestaoLayout } from '@/components/Layout/GestaoLayout';

export default function GestaoIndex() {
  return (
    <GestaoLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral da Gestão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Bem-vindo ao módulo de Gestão. Aqui você poderá centralizar operações administrativas
              e informações de empresa com a mesma identidade visual dos demais módulos.
            </p>
          </CardContent>
        </Card>
      </div>
    </GestaoLayout>
  );
}


