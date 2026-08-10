import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingById } from '../hooks/useBookings';
import RazorpayCheckout from '../components/booking/RazorpayCheckout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Ticket, Calendar, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading, isError } = useBookingById(bookingId);

  const [timeLeft, setTimeLeft] = useState(null);

  // Guard: Redirect if status is not HELD
  useEffect(() => {
    if (!booking) return;

    if (booking.status === 'CONFIRMED') {
      navigate(`/confirmation/${bookingId}`, { replace: true });
    } else if (booking.status !== 'HELD') {
      navigate(`/booking-summary/${bookingId}`, { replace: true });
    }
  }, [booking, bookingId, navigate]);

  // Hold countdown — mirrors BookingSummary; redirects to /booking-expired at zero
  useEffect(() => {
    if (!booking?.expiresAt || booking?.status !== 'HELD') return;

    const expiresAtMs = new Date(booking.expiresAt).getTime();

    const calcTime = () => {
      const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        navigate('/booking-expired', { replace: true });
      }
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);

    return () => clearInterval(interval);
  }, [booking, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[500px] space-y-6">
          <Skeleton className="h-10 w-64 mx-auto rounded-full" />
          <Skeleton className="h-[340px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Booking Not Found</h2>
          <p className="text-sm text-muted-foreground">
            We could not retrieve the details for this booking request.
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

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = timeLeft === 0;

  const seatLabelsList = Array.isArray(booking.seatLabels)
    ? booking.seatLabels.join(', ')
    : booking.seatLabels || 'Reserved seats';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 px-4">
      <div className="w-full max-w-[520px] flex flex-col items-center">
        {/* Navigation back button */}
        <div className="w-full mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/booking-summary/${bookingId}`)}
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to summary
          </button>
          <span className="text-xs font-mono text-muted-foreground">ID #{bookingId}</span>
        </div>

        {/* Header Section */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Complete Payment
          </h1>
          <p className="text-sm text-muted-foreground">
            Secure processing via Razorpay
          </p>
        </div>

        {/* Countdown Pill — only shown while hold is active */}
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-2 border rounded-full px-5 py-2 mb-6 shadow-sm text-xs font-bold ${
              isExpired
                ? 'border-red-400 text-red-600 bg-red-50/50'
                : 'border-orange-500 text-orange-600 bg-orange-50/50'
            }`}
          >
            <Clock
              className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'animate-pulse text-orange-500'}`}
            />
            <span>
              {isExpired ? (
                'Hold expired — redirecting…'
              ) : (
                <>
                  Seats held —{' '}
                  <span className="font-mono text-sm">{formattedCountdown}</span> remaining
                </>
              )}
            </span>
          </div>
        )}

        {/* Card Summary */}
        <Card className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-lg overflow-hidden mb-6">
          <CardHeader className="p-6 border-b border-zinc-100 bg-zinc-50/80 flex flex-row gap-4 items-center space-y-0">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {booking.eventName || 'Event Booking'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Seats: {seatLabelsList}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <RazorpayCheckout bookingId={bookingId} expiresAt={booking.expiresAt} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
