import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';

export const useHoldSeats = () => {
  return useMutation({
    mutationFn: async ({ eventId, seatIds }) => {
      const res = await api.post('/bookings/hold', { eventId, seatIds });
      return res.data;
    },
  });
};
