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
    { key: 'settings', icon: Settings, label: 'Configurações', color: 'text-gray-200 hover:text-white' },
    { key: 'home', icon: Home, label: 'Alavancagem', color: 'text-gray-200 hover:text-white' },
    { key: 'dollar', icon: DollarSign, label: 'Financeiro', color: 'text-gray-200 hover:text-white' },
    { key: 'trending', icon: TrendingUp, label: 'Performance', color: 'text-gray-200 hover:text-white' },
    { key: 'clock', icon: Clock, label: 'Histórico', color: 'text-gray-200 hover:text-white' },
    { key: 'search', icon: Search, label: 'Detalhamento', color: 'text-gray-200 hover:text-white' }
  ];

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="bg-gray-600 dark:bg-gray-700 rounded-xl shadow-lg p-2">
        <div className="flex flex-col space-y-3">
          {menuItems.map(({ key, icon: Icon, label, color }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={`w-10 h-10 p-0 ${color} transition-all duration-200 rounded-md`}
              onClick={() => handleClick(key)}
              title={label}
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};