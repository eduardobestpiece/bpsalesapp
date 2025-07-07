
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { Calculator, TrendingUp } from 'lucide-react';

export const Header = () => {
  return (
    <header className="border-b bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2 rounded-xl shadow-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Monteo</h1>
              <span className="text-sm text-muted-foreground font-medium">Simulador Financeiro</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="font-medium">Simule sua alavancagem</span>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
