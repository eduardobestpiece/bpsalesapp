
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CrmPerformance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Performance</h2>
                <p className="text-muted-foreground">
                  Dashboard com análise de performance e funis
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Em Desenvolvimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Esta página será implementada na próxima fase do desenvolvimento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmPerformance;
