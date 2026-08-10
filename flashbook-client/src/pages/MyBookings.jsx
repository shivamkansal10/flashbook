import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyBookings } from '../hooks/useBookings';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Ticket, Calendar, MapPin } from 'lucide-react';

const MyBookings = () => {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading, isError, refetch } = useMyBookings();

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="mb-2 text-red-600">Failed to load bookings.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground text-sm">View your active passes and ticket history</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading your tickets...</p>
      ) : bookings.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="font-semibold text-lg">No active bookings yet</p>
          <Button variant="accent" onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4 border-zinc-200 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === 'CONFIRMED' ? 'success' : b.status === 'HELD' ? 'secondary' : 'destructive'}>{b.status}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">#{b.id}</span>
                </div>
                <h3 className="text-xl font-bold">{b.eventName}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Seats: {b.seatLabels ? b.seatLabels.join(', ') : ''}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Total Paid</span>
                  <p className="text-lg font-extrabold text-foreground">₹{b.totalPrice?.toFixed(2)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/bookings/${b.id}`)}>
                  View QR Pass
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
