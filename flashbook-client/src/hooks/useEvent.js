import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

// Fetch a single event by its ID
export const useEvent = (eventId) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}`);
      return res.data;
    },
    enabled: Boolean(eventId),
  });
};
