import { GestaoLayout } from '@/components/Layout/GestaoLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GestaoAgendamentos() {
  return (
    <GestaoLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: calendário e agenda de compromissos.</p>
          </CardContent>
        </Card>
      </div>
    </GestaoLayout>
  );
}


