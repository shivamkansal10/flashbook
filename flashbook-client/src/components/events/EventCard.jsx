import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  if (!event) return null;

  const title = event.name || event.title || 'Upcoming Event';
  const venueName = typeof event.venue === 'object' ? event.venue?.name : event.venue;
  const venueCity = typeof event.venue === 'object' ? event.venue?.city : '';
  const venueText = [venueName, venueCity].filter(Boolean).join(', ') || 'Venue TBA';

  const price = event.priceFrom ?? event.minPrice ?? 0;
  const status = event.status || 'PUBLISHED';

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = () => {
    if (status === 'PUBLISHED') return null;

    if (status === 'SOLD_OUT') {
      return (
        <Badge variant="destructive" className="absolute top-3 right-3 shadow-md bg-red-600 text-white font-bold text-[10px]">
          SOLD OUT
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="absolute top-3 right-3 shadow-md font-bold text-[10px]">
        {status}
      </Badge>
    );
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border-zinc-200/80 rounded-2xl bg-white"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div>
        <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
          <img
            src={event.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80'}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {getStatusBadge()}
        </div>

        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xl font-extrabold group-hover:text-orange-500 transition-colors line-clamp-1">
            {title}
          </CardTitle>
          <CardDescription className="space-y-1.5 pt-1">
            {event.startTime && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-orange-500 shrink-0" />
                {formatEventDate(event.startTime)}
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-orange-500 shrink-0" />
              <span className="line-clamp-1">{venueText}</span>
            </div>
          </CardDescription>
        </CardHeader>
      </div>

      <CardFooter className="p-5 pt-3 flex items-center justify-between border-t border-zinc-100">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">Starting</span>
          <p className="text-lg font-black text-foreground">From ₹{price}</p>
        </div>
        <Button variant="default" size="sm" className="rounded-full font-bold px-5 bg-primary text-white hover:bg-zinc-800">
          View Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
