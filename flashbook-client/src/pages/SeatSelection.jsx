import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useEventSeats } from '../hooks/useEventSeats';
import { useHoldSeats } from '../hooks/useHoldSeats';
import SeatMap from '../components/seats/SeatMap';
import SeatLegend from '../components/seats/SeatLegend';
import HoldCountdown from '../components/seats/HoldCountdown';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import {
  ArrowLeft,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Lock,
  Ticket,
} from 'lucide-react';

const MAX_SEATS_PER_BOOKING = 8;

const SeatSelection = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [takenNotification, setTakenNotification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);

  // Fetch Event details for header
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}`);
      return res.data;
    },
    enabled: Boolean(eventId),
  });

  // Fetch Live Seats with 5s polling
  const { data: seatsData, isLoading, isError, refetch } = useEventSeats(eventId);
  const holdMutation = useHoldSeats();

  const seatsList = seatsData?.seats || [];
  const prevSeatsRef = useRef([]);

  // Auto-deselect seats if 5s poll flips them to SOLD or HELD
  useEffect(() => {
    if (!seatsList.length) return;

    if (prevSeatsRef.current.length > 0 && selectedSeatIds.length > 0) {
      const takenSeat = selectedSeatIds.find((sId) => {
        const currentSeat = seatsList.find((s) => s.id === sId);
        return currentSeat && currentSeat.status !== 'AVAILABLE';
      });

      if (takenSeat) {
        const seatObj = seatsList.find((s) => s.id === takenSeat);
        const seatLabel = seatObj ? seatObj.label : 'selected';
        
        // Auto deselect
        setSelectedSeatIds((prev) => prev.filter((id) => id !== takenSeat));
        
        // Display red notification banner for 4s
        setTakenNotification(`Sorry, seat ${seatLabel} was just taken`);
        const timer = setTimeout(() => {
          setTakenNotification('');
        }, 4000);
        return () => clearTimeout(timer);
      }
    }

    prevSeatsRef.current = seatsList;
  }, [seatsList, selectedSeatIds]);

  // Toggle Seat Selection
  const handleToggleSeat = (seatId) => {
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
      setErrorMessage('');
    } else {
      if (selectedSeatIds.length >= MAX_SEATS_PER_BOOKING) {
        setErrorMessage(`You can select a maximum of ${MAX_SEATS_PER_BOOKING} seats per booking.`);
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seatId]);
      setErrorMessage('');
    }
  };

  // Selected seats objects list and total calculation
  const selectedSeats = seatsList.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + Number(s.price || 0), 0);

  // Reserve Seats Workflow: Hold -> Create Booking -> Navigate
  const handleReserveSeats = async () => {
    if (selectedSeatIds.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Hold Seats (POST /api/bookings/hold)
      const holdResults = await holdMutation.mutateAsync({
        eventId: Number(eventId),
        seatIds: selectedSeatIds,
      });

      // Extract earliest hold expiration time if returned
      if (Array.isArray(holdResults) && holdResults.length > 0 && holdResults[0].expiresAt) {
        setHoldExpiresAt(holdResults[0].expiresAt);
      }

      // 2. Create Booking (POST /api/bookings)
      const idempotencyKey = `idempotency-${eventId}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      const bookingRes = await api.post('/bookings', {
        eventId: Number(eventId),
        seatIds: selectedSeatIds,
        idempotencyKey,
      });

      const booking = bookingRes.data;

      // 3. Navigate to Booking Summary (promo code, price review, countdown)
      navigate(`/booking-summary/${booking.id}`);
    } catch (err) {
      console.error('Reservation error:', err);
      setIsProcessing(false);

      const serverMsg = err.response?.data?.message || err.message;
      if (err.response?.status === 409 || err.response?.status === 429) {
        setErrorMessage(serverMsg || 'One or more of your selected seats were just taken. Please select different seats.');
      } else {
        setErrorMessage(serverMsg || 'Failed to hold seats. Please try again.');
      }

      // Refresh seats grid
      refetch();
    }
  };
  const handleHoldExpire = () => {
    setHoldExpiresAt(null);
    setSelectedSeatIds([]);
    refetch();
    navigate('/booking-expired');
  };

  return (
    <div className="space-y-6 py-4 max-w-[1280px] mx-auto px-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1 text-orange-500" /> Back to event details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {event?.name || 'Select Seats'}
          </h1>
          {event?.startTime && (
            <p className="text-xs text-muted-foreground font-medium pt-0.5">
              {new Date(event.startTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {holdExpiresAt && <HoldCountdown expiresAt={holdExpiresAt} onExpire={handleHoldExpire} />}
      </div>

      {/* Main Grid & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Seat Grid & Legend */}
        <div className="lg:col-span-8 space-y-4">
          {/* Taken Seat Notification Banner */}
          {takenNotification && (
            <div className="p-3.5 rounded-2xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{takenNotification}</span>
              </div>
              <button
                onClick={() => setTakenNotification('')}
                className="text-red-700 hover:text-red-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* General Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage('')} className="text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Legend Component */}
          <SeatLegend />

          {/* Seat Map Visualization */}
          {isLoading ? (
            <div className="space-y-4 bg-white p-8 rounded-2xl border border-zinc-200/80">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl space-y-3">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
              <h3 className="font-bold text-red-800">Failed to load seat map</h3>
              <Button size="sm" onClick={() => refetch()} className="rounded-full font-bold">
                Retry
              </Button>
            </div>
          ) : (
            <SeatMap
              seats={seatsList}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
              disabled={isProcessing}
            />
          )}
        </div>

        {/* Right Column: Sticky Summary Card */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-lg space-y-6">
            <h2 className="text-xl font-extrabold text-foreground pb-3 border-b border-zinc-100 flex items-center justify-between">
              <span>Your Selection</span>
              <span className="text-xs font-bold px-2.5 py-1 bg-zinc-100 rounded-full text-muted-foreground">
                {selectedSeatIds.length} / {MAX_SEATS_PER_BOOKING}
              </span>
            </h2>

            {/* Selected Seats List */}
            {selectedSeats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <Ticket className="h-8 w-8 mx-auto text-zinc-300" />
                <p className="text-xs font-medium">Click available seats on the map to select</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {selectedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-sm font-semibold"
                  >
                    <span className="text-foreground">
                      Seat {seat.label} — <span className="font-bold">₹{seat.price}</span>
                    </span>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleSeat(seat.id)}
                      className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total Price Row */}
            <div className="flex justify-between items-center font-bold text-base text-foreground pt-3 border-t border-zinc-100">
              <span>Total</span>
              <span className="text-xl font-extrabold">₹{totalPrice}</span>
            </div>

            {/* Submit Reserve Seats Button */}
            <Button
              type="button"
              disabled={selectedSeatIds.length === 0 || isProcessing}
              onClick={handleReserveSeats}
              className="w-full bg-primary text-white rounded-full h-12 text-sm font-bold hover:bg-zinc-800 shadow-sm transition-all"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Holding & Reserving...
                </span>
              ) : (
                'Reserve Seats'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Seats are held for 5 minutes once reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
