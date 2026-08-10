import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook to fetch the list of all venues.
 */
export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const res = await api.get('/venues');
      return res.data;
    },
  });
};

/**
 * Hook to create a new venue.
 */
export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/organizer/venues', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};
