import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook to create a Razorpay order for a booking.
 * Body: { bookingId }
 * Returns: { razorpayOrderId, amount, currency, keyId }
 */
export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (bookingId) => {
      const response = await api.post('/payments/create-order', {
        bookingId: Number(bookingId),
      });
      return response.data;
    },
  });
};

/**
 * Hook to verify Razorpay payment signature.
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * Returns: PaymentResponse
 */
export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
      const response = await api.post('/payments/verify', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      return response.data;
    },
  });
};
