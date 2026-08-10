import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Tag } from 'lucide-react';

/**
 * SoldOutCard — compact amber/gray "Sold Out" state block.
 *
 * Usage:
 *   <SoldOutCard eventId={event.id} />                   — inside EventDetailPage sidebar
 *   <SoldOutCard eventId={event.id} eventName="Concert"/> — standalone page context
 *
 * Props:
 *   eventId   (string|number) — used for the Join Waitlist navigation
 *   eventName (string, optional) — displayed above the card when provided
 *   className (string, optional) — extra classes on the outer wrapper
 */
const SoldOutCard = ({ eventId, eventName, className = '' }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`w-full rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-zinc-50 shadow-lg overflow-hidden ${className}`}
    >
      <div className="p-6 space-y-5">
        {/* Optional event name header */}
        {eventName && (
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
            {eventName}
          </p>
        )}

        {/* Icon + headline */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
            <Tag className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">
              This event is sold out
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Join the waitlist and we'll notify you the instant a seat frees up.
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate(`/waitlist/${eventId}`)}
          className="w-full bg-primary text-white rounded-full h-12 text-sm font-bold hover:bg-zinc-800 shadow-md transition-all"
        >
          Join Waitlist
        </Button>
      </div>
    </div>
  );
};

export default SoldOutCard;
