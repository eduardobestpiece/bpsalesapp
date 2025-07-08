
import { useQuery } from '@tanstack/react-query';

// Mock data for funnels with stages
const mockFunnels = [
  {
    id: '550e8400-e29b-41d4-a716-446655440030',
    name: 'Funil Principal',
    verification_type: 'weekly',
    verification_day: 1,
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    stages: [
      {
        id: '550e8400-e29b-41d4-a716-446655440031',
        funnel_id: '550e8400-e29b-41d4-a716-446655440030',
        name: 'Contato Inicial',
        stage_order: 1,
        target_percentage: 100,
        target_value: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440032',
        funnel_id: '550e8400-e29b-41d4-a716-446655440030',
        name: 'Qualificação',
        stage_order: 2,
        target_percentage: 70,
        target_value: 70,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440033',
        funnel_id: '550e8400-e29b-41d4-a716-446655440030',
        name: 'Proposta',
        stage_order: 3,
        target_percentage: 40,
        target_value: 40,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440034',
        funnel_id: '550e8400-e29b-41d4-a716-446655440030',
        name: 'Fechamento',
        stage_order: 4,
        target_percentage: 20,
        target_value: 20,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
  }
];

export const useFunnels = () => {
  return useQuery({
    queryKey: ['funnels'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockFunnels;
    },
  });
};
