import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Home, DollarSign, TrendingUp, Clock, Search } from 'lucide-react';

interface SimulatorMenuProps {
  onNavigate: (section: string) => void;
  onToggleSection: (section: string) => void;
}

export const SimulatorMenu = ({ onNavigate, onToggleSection }: SimulatorMenuProps) => {
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({
    settings: 0,
    home: 0,
    dollar: 0,
    trending: 0,
    clock: 0,
    search: 0
  });

  const handleClick = (section: string) => {
    const newCount = (clickCounts[section] || 0) + 1;
    setClickCounts(prev => ({ ...prev, [section]: newCount }));

    if (newCount === 1) {
      // Primeiro clique: navega para a seção
      onNavigate(section);
    } else if (newCount === 2) {
      // Segundo clique: oculta outras seções
      onToggleSection(section);
    } else if (newCount === 3) {
      // Terceiro clique: mostra todas as seções
      onToggleSection('all');
      setClickCounts(prev => ({ ...prev, [section]: 0 }));
    }
  };

  const menuItems = [
    { key: 'settings', icon: Settings, label: 'Configurações', color: 'text-gray-600 hover:text-blue-600' },
    { key: 'home', icon: Home, label: 'Alavancagem', color: 'text-gray-600 hover:text-green-600' },
    { key: 'dollar', icon: DollarSign, label: 'Financeiro', color: 'text-gray-600 hover:text-yellow-600' },
    { key: 'trending', icon: TrendingUp, label: 'Performance', color: 'text-gray-600 hover:text-purple-600' },
    { key: 'clock', icon: Clock, label: 'Histórico', color: 'text-gray-600 hover:text-orange-600' },
    { key: 'search', icon: Search, label: 'Detalhamento', color: 'text-gray-600 hover:text-red-600' }
  ];

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex flex-col space-y-2">
          {menuItems.map(({ key, icon: Icon, label, color }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={`w-12 h-12 p-0 ${color} transition-all duration-200 hover:scale-110`}
              onClick={() => handleClick(key)}
              title={label}
            >
              <Icon size={20} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}; 