
import { useQuery } from '@tanstack/react-query';

// Mock hooks for sales (will be implemented later)
export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    },
  });
};

export const useCreateSale = () => {
  return {
    mutate: async (data: any) => {
      console.log('Creating sale:', data);
    },
    isLoading: false
  };
};

export const useUpdateSale = () => {
  return {
    mutate: async (data: any) => {
      console.log('Updating sale:', data);
    },
    isLoading: false
  };
};
