
import { User, Settings, LogOut, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useModule } from '@/contexts/ModuleContext';
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

export const UserMenu = () => {
  const { setModule } = useModule();
  const navigate = useNavigate();

  const handleGoToCrm = () => {
    setModule('crm');
    navigate('/crm/indicadores');
  };

  // Exemplo de logout para referência futura:
  // const handleLogout = async () => {
  //   await signOut();
  //   navigate('/crm/login');
  // };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-primary-200 hover:ring-primary-300 transition-all duration-200">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              JS
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  JS
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold leading-none text-secondary">João Silva</p>
                <p className="text-sm leading-none text-secondary/60 mt-1">
                  joao@exemplo.com
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-primary-50/70 rounded-lg">
          <User className="mr-3 h-5 w-5 text-primary-600" />
          <span className="font-medium text-secondary">Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-primary-50/70 rounded-lg">
          <Link to="/configuracoes">
            <Settings className="mr-3 h-5 w-5 text-primary-600" />
            <span className="font-medium text-secondary">Configurações</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-blue-50/70 rounded-lg" onClick={handleGoToCrm}>
          <Users className="mr-3 h-5 w-5 text-blue-600" />
          <span className="font-medium text-secondary">CRM</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-destructive-50 text-destructive rounded-lg">
          <LogOut className="mr-3 h-5 w-5" />
          <span className="font-medium">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
