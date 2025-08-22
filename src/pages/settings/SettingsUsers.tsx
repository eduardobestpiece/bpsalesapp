
import { UsersList } from '@/components/CRM/Configuration/UsersList';

export default function SettingsUsers() {
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários do CRM</p>
      </div>
      <UsersList />
    </>
  );
} 