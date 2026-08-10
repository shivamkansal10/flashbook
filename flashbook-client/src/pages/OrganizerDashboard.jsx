import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizerEvents, useSalesOverview } from '../hooks/useOrganizer';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CalendarPlus, Edit3, Grid, QrCode } from 'lucide-react';

const OrganizerEventCard = ({ event }) => {
  const navigate = useNavigate();
  const { data: sales, isLoading } = useSalesOverview(event.id);

  return (
    <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border-zinc-200 bg-white">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant={event.status === 'PUBLISHED' ? 'success' : 'secondary'}>
            {event.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {event.venue?.name}, {event.venue?.city}
          </span>
        </div>
        <h3 className="text-lg font-bold">{event.name}</h3>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading sales data...</p>
        ) : sales ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Seats Sold: <strong className="text-foreground">{sales.soldSeats} / {sales.totalSeats}</strong> ({sales.totalSeats > 0 ? Math.round((sales.soldSeats / sales.totalSeats) * 100) : 0}%)
            </p>
            <p className="text-xs text-muted-foreground">
              Revenue: <strong className="text-foreground">₹{sales.totalRevenue?.toFixed(2)}</strong> | Held: <strong className="text-foreground">{sales.heldSeats}</strong>
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No sales data available</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <Button variant="outline" size="sm" onClick={() => navigate(`/organizer/events/${event.id}/edit`)}>
          <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/organizer/events/${event.id}/seat-map`)}>
          <Grid className="h-3.5 w-3.5 mr-1" /> Seat Map
        </Button>
        <Button variant="accent" size="sm" onClick={() => navigate(`/organizer/check-in/${event.id}`)}>
          <QrCode className="h-3.5 w-3.5 mr-1" /> Check-In
        </Button>
      </div>
    </Card>
  );
};

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data: eventPage, isLoading, isError, refetch } = useOrganizerEvents(page, 10);

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="mb-2 text-red-600">Failed to load organizer dashboard.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const events = eventPage?.content || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="accent" className="mb-1">ORGANIZER PORTAL</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">Event Operations</h1>
        </div>
        <Button variant="accent" onClick={() => navigate('/organizer/events/new')}>
          <CalendarPlus className="h-4 w-4 mr-2" /> Create New Event
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Managed Events</h2>

        {isLoading ? (
          <p className="text-muted-foreground">Loading managed events...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground">You haven't created any events yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <OrganizerEventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination Controls */}
            {eventPage && eventPage.totalPages > 1 && (
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {eventPage.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= eventPage.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
