import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook to fetch the current waitlist position for a given event.
 * Returns the raw response from the server:
 *   { eventId, userId, position, estimatedWaitMinutes, status }
 * status is one of: WAITING | PROMOTED | EXPIRED
 *
 * @param {string|number} eventId
 * @param {object} options - Optional react-query options (e.g., refetchInterval)
 */
export const useWaitlistPosition = (eventId, options = {}) => {
  return useQuery({
    queryKey: ['waitlist', eventId, 'position'],
    queryFn: async () => {
      const res = await api.get(`/waitlist/${eventId}/position`);
      return res.data;
    },
    enabled: Boolean(eventId),
    retry: false,
    ...options,
  });
};

/**
 * Hook to join the waitlist for a given event.
 * Returns a mutation object from react-query.
 */
export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId) => {
      const res = await api.post(`/waitlist/${eventId}/join`);
      return res.data;
    },
    onSuccess: (data, eventId) => {
      // Invalidate the position query so the UI refreshes.
      queryClient.invalidateQueries({ queryKey: ['waitlist', eventId, 'position'] });
    },
  });
};

/**
 * Hook to leave the waitlist for a given event.
 */
export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId) => {
      await api.delete(`/waitlist/${eventId}/leave`);
    },
    onSuccess: (data, eventId) => {
      // Invalidate to clear any stale data.
      queryClient.invalidateQueries({ queryKey: ['waitlist', eventId, 'position'] });
    },
  });
};
