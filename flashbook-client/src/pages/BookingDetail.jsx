import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useBookingById, useCancelBooking } from '../hooks/useBookings';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';

// Map booking status to badge variant and label
const statusMap = {
  HELD: { variant: 'secondary', label: 'Held' },
  CONFIRMED: { variant: 'primary', label: 'Confirmed' },
  CANCELLED: { variant: 'destructive', label: 'Cancelled' },
  EXPIRED: { variant: 'destructive', label: 'Expired' },
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: booking, isLoading, isError, error } = useBookingById(id);

  const cancelMutation = useCancelBooking();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(id);
    // Invalidate the specific booking and the bookings list
    queryClient.invalidateQueries({ queryKey: ['booking', id] });
    queryClient.invalidateQueries({ queryKey: ['bookings', 'user'] });
    navigate('/my-bookings');
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    );
  }

  // 403/404 handling – treat any error with status >=400 as not found for this UI
  const statusCode = error?.response?.status;
  if (isError && (statusCode === 403 || statusCode === 404)) {
    return (
      <div className="p-4 text-center">
        <p className="mb-2 text-red-600">Booking not found.</p>
        <Link to="/my-bookings" className="text-primary underline">
          Back to My Bookings
        </Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="mb-2 text-red-600">Failed to load booking details.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const statusInfo = statusMap[booking.status] || { variant: 'default', label: booking.status };

  const renderAction = () => {
    switch (booking.status) {
      case 'HELD':
        return (
          <Button onClick={() => navigate(`/payment/${booking.id}`)} variant="primary">
            Complete Payment
          </Button>
        );
      case 'CONFIRMED':
        return (
          <>
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">Cancel Booking</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Cancellation</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </DialogDescription>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                      Close
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowCancelDialog(false);
                      handleCancel();
                    }}
                    disabled={cancelMutation.isLoading}
                  >
                    {cancelMutation.isLoading ? 'Cancelling…' : 'Cancel Booking'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );
      case 'CANCELLED':
      case 'EXPIRED':
        return <p className="text-muted-foreground">No further actions available.</p>;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader className="space-y-2">
        <CardTitle>{booking.eventName ?? 'Untitled Event'}</CardTitle>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="font-medium">Seats: </span>
          {Array.isArray(booking.seatLabels) &&
            booking.seatLabels.map((lbl) => (
              <Badge key={lbl} variant="secondary" className="mr-1">
                {lbl}
              </Badge>
            ))}
        </div>
        <div>
          <span className="font-medium">Total Price: </span>
          ₹{booking.totalPrice?.toFixed(2) ?? '0.00'}
        </div>
        <div>
          <span className="font-medium">Reference: </span>
          {booking.idempotencyKey}
        </div>
        <div>
          <span className="font-medium">Created At: </span>
          {new Date(booking.createdAt).toLocaleString()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {renderAction()}
        <Button variant="outline" onClick={() => navigate('/my-bookings')}>
          Back to My Bookings
        </Button>
      </CardFooter>
    </Card>
  );
}
