
// Re-export all CRM hooks for backward compatibility and easier imports
export { useCrmUsers } from './useCrmUsers';
export { useFunnels } from './useFunnels';
export { useSources } from './useSources';
export { useTeams } from './useTeams';
export { useLeads, useCreateLead, useUpdateLead } from './useLeads';
export { useSales, useCreateSale, useUpdateSale } from './useSales';

// Export auth context hook
export { useCrmAuth } from '@/contexts/CrmAuthContext';
