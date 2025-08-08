
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { UsersList } from '@/components/CRM/Configuration/UsersList';

export default function SettingsUsers() {
  return (
    <SettingsLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted/30">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-full mx-auto">
            <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl border border-border p-1">
              <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[400px]">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
                  <p className="text-muted-foreground">Gerencie os usuários do CRM</p>
                </div>
                <UsersList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SettingsLayout>
  );
} 