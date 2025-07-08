
import { useQuery } from '@tanstack/react-query';

// Mock data for sources
const mockSources = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    name: 'Site Institucional',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: 'Redes Sociais',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    name: 'Indicação',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const useSources = () => {
  return useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSources;
    },
  });
};
