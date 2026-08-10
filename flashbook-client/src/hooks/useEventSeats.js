import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useEventSeats = (eventId) => {
  return useQuery({
    queryKey: ['event', eventId, 'seats'],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}/seats`);
      return res.data;
    },
    enabled: Boolean(eventId),
    refetchInterval: 5000,
  });
};
