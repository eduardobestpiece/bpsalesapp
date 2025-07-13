
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Building, Settings, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { useModule } from '@/contexts/ModuleContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { currentModule } = useModule();
  
  const navigation = [
    { name: 'Início', href: '/home', icon: Home },
    { name: 'Simulador', href: '/simulador', icon: Calculator },
    { name: 'Administradoras', href: '/administrators', icon: Building },
    { name: 'Master Config', href: '/master-config', icon: Settings },
    { name: 'CRM', href: '/crm/dashboard', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/home" className="flex items-center">
              <img 
                src="/monteo_policromia_horizontal (1).png" 
                alt="Monteo" 
                className="h-8 w-auto"
              />
            </Link>
            
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitch />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
