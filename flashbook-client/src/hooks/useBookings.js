import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useBookingById = (id) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await api.get(`/bookings/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/bookings/${id}/cancel`);
      return res.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
  });
};

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['bookings', 'user'],
    queryFn: async () => {
      const res = await api.get('/bookings/user');
      return res.data;
    },
  });
};
