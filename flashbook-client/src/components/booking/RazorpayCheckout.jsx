import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrder, useVerifyPayment } from '../../hooks/usePayments';
import { Button } from '../ui/button';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

const formatCurrency = (amountInPaise, currency = 'INR') => {
  if (typeof amountInPaise !== 'number' || isNaN(amountInPaise)) return '';
  const value = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const ensureRazorpayLoaded = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayCheckout = ({ bookingId, expiresAt, onOrderCreated }) => {
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrder();
  const verifyMutation = useVerifyPayment();

  const [orderData, setOrderData] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'processing'

  // Step 1: Call POST /payments/create-order on mount
  useEffect(() => {
    let isMounted = true;
    if (!bookingId) return;

    createOrderMutation.mutate(bookingId, {
      onSuccess: (data) => {
        if (!isMounted) return;
        setOrderData(data);
        if (onOrderCreated) {
          onOrderCreated(data);
        }
      },
      onError: (err) => {
        if (!isMounted) return;
        console.error('Failed to create Razorpay order:', err);
        navigate('/payment-failed', { state: { bookingId } });
      },
    });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleOpenCheckout = useCallback(async () => {
    // Pre-flight expiry guard — don't attempt Razorpay if the hold is already gone
    if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
      navigate('/booking-expired', { replace: true });
      return;
    }

    if (status === 'processing' || !orderData) return;

    setStatus('processing');

    const loaded = await ensureRazorpayLoaded();
    if (!loaded || !window.Razorpay) {
      console.error('Razorpay SDK failed to load.');
      setStatus('idle');
      navigate('/payment-failed', { state: { bookingId } });
      return;
    }

    try {
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: 'FlashBook',
        description: `Booking #${bookingId} Ticket Payment`,
        handler: async (response) => {
          try {
            await verifyMutation.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/confirmation/${bookingId}`, { replace: true });
          } catch (error) {
            console.error('Payment verification failed:', error);
            navigate('/payment-failed', { state: { bookingId } });
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('idle');
          },
        },
        theme: {
          color: '#111111',
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        setStatus('idle');
        navigate('/payment-failed', {
          state: {
            bookingId,
            reason: response.error?.description || 'Payment was declined.',
          },
        });
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Error opening Razorpay modal:', err);
      setStatus('idle');
      navigate('/payment-failed', { state: { bookingId } });
    }
  }, [status, orderData, bookingId, expiresAt, verifyMutation, navigate]);

  const isCreatingOrder = createOrderMutation.isPending;
  const isVerifying = verifyMutation.isPending;
  const isProcessing = status === 'processing' || isCreatingOrder || isVerifying;
  const isExpired = expiresAt ? Date.now() > new Date(expiresAt).getTime() : false;

  const formattedAmount = orderData ? formatCurrency(orderData.amount, orderData.currency) : null;

  return (
    <div className="w-full space-y-4">
      {orderData && (
        <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
          <span className="text-sm font-medium text-muted-foreground">Amount to Pay</span>
          <span className="text-2xl font-black text-foreground">{formattedAmount}</span>
        </div>
      )}

      <Button
        onClick={handleOpenCheckout}
        disabled={isProcessing || !orderData || isExpired}
        className="w-full bg-primary text-white rounded-full h-13 text-base font-bold hover:bg-zinc-800 shadow-md transition-all disabled:opacity-60"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {isVerifying ? 'Verifying Payment...' : isCreatingOrder ? 'Preparing Order...' : 'Processing...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Pay {formattedAmount || 'Now'}
          </span>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Encrypted 256-bit Razorpay Checkout</span>
      </div>
    </div>
  );
};

export default RazorpayCheckout;
