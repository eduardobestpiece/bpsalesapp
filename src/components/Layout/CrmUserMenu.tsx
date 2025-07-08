
import { User, Settings, LogOut, Calculator, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModule } from '@/contexts/ModuleContext';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const CrmUserMenu = () => {
  const { setModule } = useModule();
  const { crmUser, signOut, userRole } = useCrmAuth();

  const handleGoToSimulator = () => {
    setModule('simulator');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = crmUser 
    ? `${crmUser.first_name.charAt(0)}${crmUser.last_name.charAt(0)}`
    : 'U';

  const userName = crmUser 
    ? `${crmUser.first_name} ${crmUser.last_name}`
    : 'Usuário';

  const isMaster = userRole === 'master';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-primary-200 hover:ring-primary-300 transition-all duration-200">
          <Avatar className="h-10 w-10">
            <AvatarImage src={crmUser?.avatar_url} alt="User" />
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={crmUser?.avatar_url} alt="User" />
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold leading-none text-secondary">{userName}</p>
                <p className="text-sm leading-none text-secondary/60 mt-1">
                  {crmUser?.email}
                </p>
                {crmUser?.role && (
                  <p className="text-xs leading-none text-primary mt-1 capitalize">
                    {crmUser.role === 'master' ? 'Master' : 
                     crmUser.role === 'admin' ? 'Administrador' :
                     crmUser.role === 'leader' ? 'Líder' : 'Usuário'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-primary-50/70 rounded-lg">
          <Link to="/crm/perfil">
            <User className="mr-3 h-5 w-5 text-primary-600" />
            <span className="font-medium text-secondary">Perfil</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-primary-50/70 rounded-lg">
          <Link to="/crm/configuracoes">
            <Settings className="mr-3 h-5 w-5 text-primary-600" />
            <span className="font-medium text-secondary">Configurações</span>
          </Link>
        </DropdownMenuItem>

        {isMaster && (
          <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-yellow-50/70 rounded-lg">
            <Link to="/crm/master">
              <Shield className="mr-3 h-5 w-5 text-yellow-600" />
              <span className="font-medium text-secondary">Configurações Master</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-blue-50/70 rounded-lg" onClick={handleGoToSimulator}>
          <Link to="/" className="flex items-center w-full">
            <Calculator className="mr-3 h-5 w-5 text-blue-600" />
            <span className="font-medium text-secondary">Simulador</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="p-3 cursor-pointer hover:bg-destructive-50 text-destructive rounded-lg"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span className="font-medium">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
