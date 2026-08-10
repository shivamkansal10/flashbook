import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useBookingById, useCancelBooking } from '../hooks/useBookings';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  XCircle,
  RefreshCw,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Read bookingId and optional failure reason from router state or query param fallback
  const bookingId = location.state?.bookingId || searchParams.get('bookingId') || null;
  const failureReason = location.state?.reason || null;

  const {
    data: booking,
    isLoading,
    isError,
    refetch,
  } = useBookingById(bookingId);

  const cancelBookingMutation = useCancelBooking();

  const [timeLeft, setTimeLeft] = useState(null);

  // Hold countdown: use real expiresAt from backend booking response
  useEffect(() => {
    if (!booking?.expiresAt || !['HELD', 'EXPIRED'].includes(booking.status)) return;

    const expiresAtMs = new Date(booking.expiresAt).getTime();

    const calc = () => {
      const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(diff);

      // Refetch once when timer expires so status flips to EXPIRED
      if (diff === 0) refetch();
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [booking, refetch]);

  const handleRetry = () => {
    navigate(`/payment/${bookingId}`);
  };

  const handleCancel = () => {
    cancelBookingMutation.mutate(bookingId, {
      onSuccess: () => navigate('/events'),
    });
  };

  const isExpired =
    booking?.status === 'EXPIRED' || (booking?.status === 'HELD' && timeLeft === 0);

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  /* ────────────────── Generic (no bookingId) ────────────────── */
  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-5 shadow-lg overflow-hidden">
          <div className="relative mx-auto w-fit">
            <span className="absolute inset-0 rounded-full bg-red-400/25 animate-ping" />
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200">
              <XCircle className="h-9 w-9" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-foreground">Payment Failed</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {failureReason
              ? failureReason
              : 'We were unable to process your payment. If you had a seat reservation, it may have been released back to the inventory pool.'}
          </p>

          <Button
            onClick={() => navigate('/events')}
            className="w-full rounded-full h-12 font-bold bg-primary text-white hover:bg-zinc-800 shadow-md"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  /* ────────────────── Loading ────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[520px] space-y-6">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          <Skeleton className="h-[260px] w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  /* ────────────────── Error / Not Found ────────────────── */
  if (isError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Booking Not Found</h2>
          <p className="text-sm text-muted-foreground">
            We could not retrieve this booking. It may have expired or been cancelled.
          </p>
          <Button
            onClick={() => navigate('/events')}
            className="rounded-full font-bold bg-primary text-white hover:bg-zinc-800"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  /* ────────────────── Main Failed State ────────────────── */
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 px-4">
      <div className="w-full max-w-[540px] flex flex-col items-center">
        {/* ── Failure Badge ── */}
        <div className="relative mb-6">
          <span className="absolute inset-0 rounded-full bg-red-400/25 animate-ping" />
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200">
            <XCircle className="h-10 w-10" />
          </div>
        </div>

        {/* ── Heading ── */}
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground text-center">
          Payment Failed
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-4 text-center">
          We were unable to process your payment transaction.
        </p>

        {/* ── Countdown Pill (only when still held) ── */}
        {!isExpired && timeLeft !== null && (
          <div className="flex items-center gap-2 border border-orange-500 text-orange-600 rounded-full px-5 py-2 mb-6 bg-orange-50/50 shadow-sm text-xs font-bold">
            <Clock className="h-4 w-4 animate-pulse text-orange-500" />
            <span>
              Seats held —{' '}
              <span className="font-mono text-sm">{formattedCountdown}</span> remaining
            </span>
          </div>
        )}

        {/* ── Info Card ── */}
        <div className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-lg overflow-hidden mb-6">
          <div className="p-6 space-y-4">
            {/* Booking reference */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Booking Reference
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                #{bookingId}
              </span>
            </div>

            {/* Event name (if available) */}
            {booking.eventName && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-muted-foreground">Event</span>
                <span className="font-bold text-foreground truncate max-w-[60%] text-right">
                  {booking.eventName}
                </span>
              </div>
            )}

            {/* Seat labels */}
            {booking.seatLabels && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-muted-foreground">Seats</span>
                <span className="font-bold text-foreground bg-zinc-100 px-3 py-1 rounded-full text-xs">
                  {Array.isArray(booking.seatLabels)
                    ? booking.seatLabels.join(', ')
                    : booking.seatLabels}
                </span>
              </div>
            )}

            {/* Total */}
            {booking.totalPrice != null && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-zinc-200">
                <span className="font-semibold text-foreground">Amount</span>
                <span className="text-lg font-black text-foreground">
                  ₹{booking.totalPrice}
                </span>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 pt-2 border-t border-dashed border-zinc-200">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </span>
              {isExpired ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  <Clock className="h-3 w-3" />
                  EXPIRED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  <XCircle className="h-3 w-3" />
                  PAYMENT FAILED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="w-full flex flex-col gap-3 mb-8">
          {isExpired ? (
            /* Hold expired — only option is to browse events */
            <Button
              onClick={() => navigate('/events')}
              className="w-full bg-primary text-white rounded-full h-13 text-base font-bold hover:bg-zinc-800 shadow-md transition-all"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Browse Events
            </Button>
          ) : (
            <>
              {/* Try Again */}
              <Button
                onClick={handleRetry}
                disabled={cancelBookingMutation.isPending}
                className="w-full bg-primary text-white rounded-full h-13 text-base font-bold hover:bg-zinc-800 shadow-md transition-all"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              {/* Cancel Booking */}
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelBookingMutation.isPending}
                className="w-full rounded-full h-11 text-sm font-bold border-zinc-300 text-foreground hover:bg-zinc-100"
              >
                {cancelBookingMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cancelling...
                  </span>
                ) : (
                  'Cancel Booking'
                )}
              </Button>
            </>
          )}

          {/* Subtle back link */}
          {!isExpired && (
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center justify-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              Back to Events <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {/* ── Reassurance ── */}
        <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed">
          {isExpired
            ? 'Your seat reservation has expired. You can select new seats from the event page.'
            : 'Your seats are still reserved. Retry payment before the hold timer expires to keep them.'}
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
