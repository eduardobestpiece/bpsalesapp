
import { Button } from '@/components/ui/button';
import { CrmUserMenu } from './CrmUserMenu';
import { Calculator, Users, BarChart3, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const CrmHeader = () => {
  const location = useLocation();

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/crm" className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Monteo CRM</h1>
              <span className="text-sm text-secondary/60 font-medium">Sistema de Gestão</span>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/crm">
              <Button 
                variant={isActivePath('/crm') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            
            <Link to="/crm/indicadores">
              <Button 
                variant={isActivePath('/crm/indicadores') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Indicadores</span>
              </Button>
            </Link>
            
            <Link to="/crm/performance">
              <Button 
                variant={isActivePath('/crm/performance') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Performance</span>
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-secondary/70 bg-blue-50/70 px-3 py-1.5 rounded-full">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Gerencie seus leads</span>
          </div>
          <CrmUserMenu />
        </div>
      </div>
    </header>
  );
};
