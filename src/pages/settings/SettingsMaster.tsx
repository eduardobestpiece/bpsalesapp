
// import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import CrmMasterConfig from '@/pages/crm/CrmMasterConfig';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export default function SettingsMaster() {
  const { userRole } = useCrmAuth();

  if (userRole !== 'master') {
    return (
      <SettingsLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
            <p className="text-secondary/60">Apenas usuários Master podem acessar esta página.</p>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return <CrmMasterConfig />;
} 