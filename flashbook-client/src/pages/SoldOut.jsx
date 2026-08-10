import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import SoldOutCard from '../components/events/SoldOutCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * Standalone Sold-Out page at /events/:id/sold-out.
 * Fetches the event by ID, shows its name, and renders the reusable SoldOutCard.
 */
const SoldOut = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await api.get(`/events/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] space-y-6">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ── Error / Not Found ── */
  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <div className="w-full max-w-[480px] bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
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
      </div>
    );
  }

  const title = event.name || event.title || 'Event';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
      <div className="w-full max-w-[480px] flex flex-col items-center">
        {/* Back link */}
        <div className="w-full mb-5">
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1 text-orange-500" />
            Back to event
          </Link>
        </div>

        {/* Event title */}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground text-center mb-6">
          {title}
        </h1>

        {/* Sold Out Card */}
        <SoldOutCard eventId={id} />

        {/* Secondary link */}
        <button
          onClick={() => navigate('/events')}
          className="mt-5 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse other events
        </button>
      </div>
    </div>
  );
};

export default SoldOut;
