
import { useQuery } from '@tanstack/react-query';

// Mock data for CRM users
const mockUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'eduardocosta@bestpiece.com.br',
    first_name: 'Eduardo',
    last_name: 'Costa',
    phone: '(11) 99999-9999',
    role: 'master',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    team_id: '550e8400-e29b-41d4-a716-446655440010',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'maria@empresa.com',
    first_name: 'Maria',
    last_name: 'Santos',
    phone: '(11) 88888-8888',
    role: 'admin',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    team_id: '550e8400-e29b-41d4-a716-446655440010',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'pedro@empresa.com',
    first_name: 'Pedro',
    last_name: 'Oliveira',
    phone: '(11) 77777-7777',
    role: 'leader',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    team_id: '550e8400-e29b-41d4-a716-446655440010',
    leader_id: '550e8400-e29b-41d4-a716-446655440003',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const useCrmUsers = () => {
  return useQuery({
    queryKey: ['crm-users'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockUsers;
    },
  });
};
