import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useOrganizerEvents = (page = 0, size = 10) => {
  return useQuery({
    queryKey: ['organizerEvents', page, size],
    queryFn: async () => {
      const res = await api.get('/organizer/events', {
        params: { page, size }
      });
      return res.data;
    }
  });
};

export const useSalesOverview = (eventId) => {
  return useQuery({
    queryKey: ['salesOverview', eventId],
    queryFn: async () => {
      const res = await api.get(`/organizer/events/${eventId}/sales`);
      return res.data;
    },
    enabled: Boolean(eventId)
  });
};
