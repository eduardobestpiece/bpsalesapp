
import { useQuery } from '@tanstack/react-query';

// Mock data for teams
const mockTeams = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Equipe Vendas',
    leader_id: '550e8400-e29b-41d4-a716-446655440003',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTeams;
    },
  });
};
