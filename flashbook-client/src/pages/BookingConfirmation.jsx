import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingById } from '../hooks/useBookings';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  CheckCircle2,
  Ticket,
  Download,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import api from '../api/axios';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: booking, isLoading, isError } = useBookingById(bookingId);

  // Guard: redirect if status is not CONFIRMED
  useEffect(() => {
    if (booking && booking.status !== 'CONFIRMED') {
      navigate(`/booking-summary/${bookingId}`, { replace: true });
    }
  }, [booking, bookingId, navigate]);

  const handleCopyRef = () => {
    if (!booking?.idempotencyKey) return;
    navigator.clipboard.writeText(booking.idempotencyKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTicket = async () => {
    if (!booking) return;
    setDownloading(true);
    try {
      const response = await api.get(`/bookings/${booking.id}/ticket`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashseat-ticket-${booking.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF ticket', err);
      alert('Failed to download PDF ticket. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[560px] space-y-6">
          <Skeleton className="h-10 w-48 mx-auto rounded-full" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  /* ---------- Error / Not Found ---------- */
  if (isError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Booking Not Found</h2>
          <p className="text-sm text-muted-foreground">
            We could not find the requested booking or it may have been removed.
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

  /* ---------- Render only if CONFIRMED ---------- */
  if (booking.status !== 'CONFIRMED') return null;

  const seatLabels = Array.isArray(booking.seatLabels)
    ? booking.seatLabels
    : typeof booking.seatLabels === 'string'
      ? booking.seatLabels.split(',').map((s) => s.trim())
      : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 px-4">
      <div className="w-full max-w-[580px] flex flex-col items-center">
        {/* ── Success Badge ── */}
        <div className="relative mb-6">
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        </div>

        {/* ── Heading ── */}
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground text-center">
          Booking Confirmed!
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6 text-center">
          Your tickets are locked and ready for event entry.
        </p>

        {/* ── Confirmation Card ── */}
        <div className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-lg overflow-hidden mb-6">
          {/* Card Header */}
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/80 flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Ticket className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">
                {booking.eventName || 'Event Booking'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Booking #{booking.id}
                {booking.createdAt && (
                  <span className="ml-2 text-zinc-400">
                    · {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-4">
            {/* Seat Chips */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Seats
              </span>
              <div className="flex flex-wrap gap-2">
                {seatLabels.length > 0 ? (
                  seatLabels.map((label, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      <Ticket className="h-3 w-3" />
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Seats reserved</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-zinc-200">
              <span className="text-sm font-semibold text-foreground">Total Paid</span>
              <span className="text-xl font-black text-foreground">
                ₹{booking.totalPrice ?? '—'}
              </span>
            </div>

            {/* Booking Reference */}
            <div className="pt-3 border-t border-dashed border-zinc-200 space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Booking Reference
              </span>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-100 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-foreground tracking-wide select-all break-all">
                  {booking.idempotencyKey || '—'}
                </code>
                <button
                  onClick={handleCopyRef}
                  className="shrink-0 h-10 w-10 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 flex items-center justify-center transition-colors"
                  title="Copy reference"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-zinc-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 pt-3 border-t border-dashed border-zinc-200">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                CONFIRMED
              </span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="w-full flex flex-col gap-3 mb-8">
          <Button
            onClick={() => navigate('/my-bookings')}
            className="w-full bg-primary text-white rounded-full h-13 text-base font-bold hover:bg-zinc-800 shadow-md transition-all"
          >
            <Ticket className="h-4 w-4 mr-2" />
            View My Bookings
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadTicket}
            disabled={downloading}
            className="w-full rounded-full h-11 text-sm font-bold border-zinc-300 text-foreground hover:bg-zinc-100"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF Ticket'}
          </Button>

          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center justify-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            Back to Events <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* ── Reassurance ── */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-muted-foreground text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Payment received</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            <span>Instant e-ticket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>QR pass in My Bookings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
