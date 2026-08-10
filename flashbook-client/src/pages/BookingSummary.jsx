import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBookingById, useCancelBooking } from '../hooks/useBookings';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import api from '../api/axios';
import {
  Clock,
  Lock,
  Ticket,
  Calendar,
  AlertCircle,
  XCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const BookingSummary = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading, isError, refetch } = useBookingById(bookingId);
  const cancelBookingMutation = useCancelBooking();

  const [timeLeft, setTimeLeft] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplying(true);
    setPromoError('');
    try {
      await api.post(`/bookings/${booking.id}/apply-promo`, { code: promoCode.trim() });
      setPromoApplied(true);
      setPromoCode('');
      refetch();
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid or expired promo code');
    } finally {
      setApplying(false);
    }
  };

  // If status is CONFIRMED, redirect to /confirmation/{bookingId}
  useEffect(() => {
    if (booking?.status === 'CONFIRMED') {
      navigate(`/confirmation/${bookingId}`, { replace: true });
    }
  }, [booking, bookingId, navigate]);

  // Compute Hold Countdown using expiresAt from the backend
  useEffect(() => {
    if (!booking?.expiresAt || booking?.status !== 'HELD') return;

    const expiresAtMs = new Date(booking.expiresAt).getTime();

    const calcTime = () => {
      const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        // Refetch booking when hold timer expires
        refetch();
      }
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);

    return () => clearInterval(interval);
  }, [booking, refetch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[600px] space-y-6">
          <Skeleton className="h-10 w-64 mx-auto rounded-full" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
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
            We could not find the requested booking summary or it may have been removed.
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

  // EXPIRED STATE
  if (booking.status === 'EXPIRED' || (booking.status === 'HELD' && timeLeft === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-amber-200/80 rounded-2xl p-8 text-center space-y-5 shadow-lg">
          <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground">Hold Expired</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This booking hold has expired — the seats were released back to the event pool.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/events/${booking.eventId || ''}`)}
            className="w-full rounded-full font-bold bg-primary text-white hover:bg-zinc-800 h-12"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Select New Seats
          </Button>
        </div>
      </div>
    );
  }

  // CANCELLED STATE
  if (booking.status === 'CANCELLED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-5 shadow-lg">
          <div className="h-14 w-14 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto">
            <XCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-foreground">Booking Cancelled</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This booking was successfully cancelled and your held seats have been released.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/events/${booking.eventId || ''}`)}
            className="w-full rounded-full font-bold bg-primary text-white hover:bg-zinc-800 h-12"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Event
          </Button>
        </div>
      </div>
    );
  }

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const seatLabelsList = Array.isArray(booking.seatLabels)
    ? booking.seatLabels.join(', ')
    : booking.seatLabels || 'Seats reserved';

  const handleCancel = () => {
    cancelBookingMutation.mutate(booking.id, {
      onSuccess: () => {
        navigate(`/events/${booking.eventId || ''}`);
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 px-4">
      <div className="w-full max-w-[600px] flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Review your booking
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete payment within the time shown to keep your seats.
          </p>
        </div>

        {/* Countdown Pill */}
        <div className="flex items-center gap-2 border border-orange-500 text-orange-600 rounded-full px-5 py-2 mb-6 bg-orange-50/50 shadow-sm text-xs font-bold">
          <Clock className="h-4 w-4 animate-pulse text-orange-500" />
          <span>
            Seats held — <span className="font-mono text-sm">{formattedCountdown}</span> remaining
          </span>
        </div>

        {/* Summary Card */}
        <div className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-lg mb-6 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/80 flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Ticket className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {booking.eventName || 'Event Ticket Booking'}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Booking ID #{booking.id}
              </p>
            </div>
          </div>

          {/* Seat Details */}
          <div className="p-6 border-b border-zinc-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-foreground">Selected Seats</span>
              <span className="font-bold text-foreground bg-zinc-100 px-3 py-1 rounded-full text-xs">
                {seatLabelsList}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-zinc-200">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-semibold text-muted-foreground">
                ₹{booking.seats ? booking.seats.reduce((sum, s) => sum + (s.price || 0), 0) : booking.totalPrice}
              </span>
            </div>
            {booking.promoCode && (
              <div className="flex justify-between items-center text-sm text-emerald-600 font-medium">
                <span>Discount ({booking.promoCode})</span>
                <span>
                  -₹{Math.max(0, (booking.seats ? booking.seats.reduce((sum, s) => sum + (s.price || 0), 0) : booking.totalPrice) - booking.totalPrice)}
                </span>
              </div>
            )}
          </div>

          {/* Promo Code Form */}
          {booking.status === 'HELD' && (
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/40 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">Promo Code</div>
              {booking.promoCode ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Code <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">{booking.promoCode}</span> applied!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={applying}
                      className="h-10 text-sm rounded-lg"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={applying || !promoCode.trim()}
                      className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg shrink-0"
                    >
                      {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span>{promoError}</span>
                    </p>
                  )}
                  {promoApplied && (
                    <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span>Promo applied successfully!</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Total Price Banner */}
          <div className="p-6 flex justify-between items-center bg-zinc-50/50">
            <span className="text-xl font-extrabold text-foreground">Total</span>
            <span className="text-2xl font-black text-foreground">₹{booking.totalPrice}</span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="w-full flex flex-col gap-3 mb-8">
          <Button
            onClick={() => navigate(`/payment/${booking.id}`)}
            disabled={booking.status !== 'HELD' || cancelBookingMutation.isPending}
            className="w-full bg-primary text-white rounded-full h-13 text-base font-bold hover:bg-zinc-800 shadow-md transition-all"
          >
            Proceed to Payment
          </Button>

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
        </div>

        {/* Reassurance Row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-muted-foreground text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Instant e-ticket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Free cancellation before payment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
