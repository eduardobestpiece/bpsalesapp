
import React from 'react';
import { MasterConfigProvider } from '@/contexts/MasterConfigContext';
import { MasterConfigLayout } from '@/components/MasterConfig/MasterConfigLayout';

const MasterConfig: React.FC = () => {
  return (
    <MasterConfigProvider>
      <MasterConfigLayout />
    </MasterConfigProvider>
  );
};

export default MasterConfig;
