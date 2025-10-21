import { GestaoLayout } from '@/components/Layout/GestaoLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GestaoVendas() {
  return (
    <GestaoLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: pipeline de vendas e relatórios.</p>
          </CardContent>
        </Card>
      </div>
    </GestaoLayout>
  );
}


