
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';

export const Header = () => {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-amber-600">Monteo</h1>
          <span className="text-muted-foreground">Simulador Financeiro</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
