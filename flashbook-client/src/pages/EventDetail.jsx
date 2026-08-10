import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Tag,
  Lock,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  Map,
  Users,
} from 'lucide-react';
import SoldOutCard from '../components/events/SoldOutCard';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await api.get(`/events/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });

  React.useEffect(() => {
    if (event && (event.status === 'SOLD_OUT' || event.availableSeats === 0)) {
      navigate(`/events/${id}/sold-out`, { replace: true });
    }
  }, [event, id, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-8 py-6 max-w-[1280px] mx-auto px-4">
        <Skeleton className="h-[400px] md:h-[480px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white border border-zinc-200/80 rounded-2xl shadow-sm space-y-4">
        <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Event Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The event you are looking for does not exist or may have been removed.
        </p>
        <Button
          onClick={() => navigate('/events')}
          className="rounded-full font-bold bg-primary text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
        </Button>
      </div>
    );
  }

  // Parse event fields
  const title = event.name || event.title || 'Event Details';
  const description = event.description || 'No description available for this event.';
  const category = event.category || 'General';
  
  const venueName = typeof event.venue === 'object' ? event.venue?.name : event.venue || 'Venue TBA';
  const venueCity = typeof event.venue === 'object' ? event.venue?.city : '';
  const venueAddress = typeof event.venue === 'object' ? event.venue?.address : '';
  const fullAddress = [venueAddress, venueCity].filter(Boolean).join(', ') || 'Address available upon booking';

  const price = event.priceFrom ?? event.minPrice ?? 0;
  const isSoldOut = event.status === 'SOLD_OUT' || event.availableSeats === 0;
  const isFillingFast = !isSoldOut && event.availableSeats !== undefined && event.availableSeats <= 5;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBA';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venueName} ${fullAddress}`
  )}`;

  return (
    <div className="space-y-8 py-4 max-w-[1280px] mx-auto px-4">
      {/* Navigation Back Link */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1 text-orange-500" /> Back to all events
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-[380px] sm:h-[450px] md:h-[500px] rounded-2xl overflow-hidden shadow-md">
        <img
          src={
            event.imageUrl ||
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'
          }
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 md:p-10 text-white space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md leading-tight">
            {title}
          </h1>

          {/* Info Chips */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-xs sm:text-sm font-semibold">
              <Calendar className="h-4 w-4 text-white" />
              <span>{formatDate(event.startTime)}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-xs sm:text-sm font-semibold">
              <MapPin className="h-4 w-4 text-white" />
              <span>{[venueName, venueCity].filter(Boolean).join(', ')}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-xs sm:text-sm font-semibold">
              <Tag className="h-4 w-4 text-white" />
              <span>{category}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid (Two Column) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT COLUMN: About & Venue */}
        <div className="md:col-span-8 space-y-8">
          {/* About Event */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">About this event</h2>
            <div className="text-base text-zinc-600 leading-relaxed space-y-4 whitespace-pre-line">
              <p>{description}</p>
            </div>
          </section>

          <hr className="border-zinc-200" />

          {/* Venue Card */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Venue Location</h2>
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 flex flex-col sm:flex-row gap-6 shadow-sm justify-between items-start sm:items-center">
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-foreground">{venueName}</h3>
                <p className="text-sm text-muted-foreground">{fullAddress}</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors pt-2"
                >
                  Get Directions <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </div>

              {/* Static Map Placeholder */}
              <div className="w-full sm:w-48 h-32 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200/80 relative overflow-hidden shrink-0 group">
                <div
                  className="absolute inset-0 opacity-40 bg-zinc-200"
                  style={{
                    backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                />
                <div className="flex flex-col items-center gap-1 text-muted-foreground relative z-10">
                  <Map className="h-8 w-8 text-zinc-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Map View</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sticky Booking Sidebar */}
        <div className="md:col-span-4 relative">
          {isSoldOut ? (
            <div className="sticky top-24">
              <SoldOutCard eventId={id} />
            </div>
          ) : (
            <div className="sticky top-24 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-lg space-y-5">
              <div>
                <div className="text-3xl font-extrabold text-foreground">₹{price}</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Starting price per seat</div>
              </div>

              {/* Availability Indicator */}
              {isFillingFast ? (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200/60">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-700">Filling fast! Only a few seats left</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200/60">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-green-700">Seats available</span>
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={() => navigate(`/events/${id}/seats`)}
                className="w-full bg-primary text-white rounded-full h-12 text-sm font-bold hover:bg-zinc-800 shadow-sm"
              >
                Select Seats
              </Button>

              {/* Trust Line */}
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground pt-1">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Secure, instant confirmation</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
