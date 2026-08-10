import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

// Hook to fetch rate limit events for admin dashboard
export const useRateLimitEvents = () => {
  return useQuery({
    queryKey: ['admin', 'rate-limits'],
    queryFn: async () => {
      const response = await api.get('/admin/rate-limit-events');
      return response.data; // Expected shape: { status: string, rateLimiters: { [name]: { availablePermissions: number, numberOfWaitingThreads: number } } }
    },
    refetchInterval: 5000,
  });
};
