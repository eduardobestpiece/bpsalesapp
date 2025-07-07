
import { User, Settings, Building2, Package, Target, LogOut } from 'lucide-react';
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-primary-100 hover:ring-primary-200 transition-all duration-200">
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
                <p className="text-base font-semibold leading-none">João Silva</p>
                <p className="text-sm leading-none text-muted-foreground mt-1">
                  joao@exemplo.com
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-primary-50 rounded-lg">
          <User className="mr-3 h-5 w-5 text-primary-600" />
          <span className="font-medium">Meu Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-primary-50 rounded-lg">
          <Building2 className="mr-3 h-5 w-5 text-primary-600" />
          <span className="font-medium">Administradoras</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-primary-50 rounded-lg">
          <Package className="mr-3 h-5 w-5 text-primary-600" />
          <span className="font-medium">Produtos</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-primary-50 rounded-lg">
          <Target className="mr-3 h-5 w-5 text-primary-600" />
          <span className="font-medium">Modalidades de Lances</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-3 cursor-pointer hover:bg-primary-50 rounded-lg">
          <Settings className="mr-3 h-5 w-5 text-primary-600" />
          <span className="font-medium">Configurações</span>
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
