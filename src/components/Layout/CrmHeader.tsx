
import { Button } from '@/components/ui/button';
import { CrmUserMenu } from './CrmUserMenu';
import { Calculator, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CrmHeader = () => {
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
