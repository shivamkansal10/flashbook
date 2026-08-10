import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useWaitlistPosition, useJoinWaitlist, useLeaveWaitlist } from '../hooks/useWaitlist';

/**
 * Page to display the current waitlist status for an event.
 * Handles three UI states:
 *   1. Not joined – show a button to join the waitlist.
 *   2. Joined – show position, estimated wait time, and leave button.
 *   3. Promoted – show a success banner with a "Complete Booking" call‑to‑action.
 */
const WaitlistStatus = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Fetch waitlist position. Refetch every 15 s while the user is still waiting.
  // Uses the function form of refetchInterval (TanStack Query v5) so we can safely
  // read from the query's own cached data without a TDZ reference to `data`.
  const { data, isLoading, isError, refetch } = useWaitlistPosition(eventId, {
    refetchInterval: (query) => query.state.data?.status === 'WAITING' ? 15000 : false,
  });

  const joinMutation = useJoinWaitlist();
  const leaveMutation = useLeaveWaitlist();

  const handleJoin = () => {
    joinMutation.mutate(eventId, {
      onSuccess: () => refetch(),
    });
  };

  const handleLeave = () => {
    leaveMutation.mutate(eventId, {
      onSuccess: () => navigate(`/events/${eventId}`),
    });
  };

  const handleCompleteBooking = () => {
    navigate(`/events/${eventId}/seats`);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </Card>
      </div>
    );
  }

  // Not joined yet – the server returns 404 which React Query treats as error.
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <Card className="w-full max-w-md p-6 space-y-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">You are not on the waitlist for this event.</h2>
          <Button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="w-full bg-primary text-white rounded-full h-10"
          >
            {joinMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Joining…
              </span>
            ) : (
              'Join Waitlist'
            )}
          </Button>
        </Card>
      </div>
    );
  }

  // User is on the waitlist – show status information.
  const { position, estimatedWaitMinutes, status } = data;

  // WaitlistService returns status: 'EXPIRED' with position: -1 as a sentinel
  // meaning the user's entry has expired and they are no longer on the waitlist.
  // Render the same "not on waitlist" card rather than displaying "#-1".
  if (status === 'EXPIRED' || position < 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
        <Card className="w-full max-w-md p-6 space-y-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">You are not on the waitlist for this event.</h2>
          <Button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="w-full bg-primary text-white rounded-full h-10"
          >
            {joinMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Joining…
              </span>
            ) : (
              'Join Waitlist'
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] py-8 px-4">
      <Card className="w-full max-w-md p-6 space-y-6 text-center">
        <h2 className="text-2xl font-extrabold text-foreground">Waitlist Status</h2>
        <div className="text-lg text-foreground">Your position: <span className="font-bold">#{position}</span></div>
        {estimatedWaitMinutes != null && (
          <div className="text-sm text-muted-foreground">Estimated wait: {estimatedWaitMinutes} minute{estimatedWaitMinutes !== 1 ? 's' : ''}</div>
        )}
        {status === 'PROMOTED' && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-md p-4 mt-4">
            <p className="font-medium">A seat is available for you!</p>
            <Button onClick={handleCompleteBooking} className="mt-2 w-full bg-emerald-600 text-white rounded-full">
              Complete Booking
            </Button>
          </div>
        )}
        <Button onClick={handleLeave} disabled={leaveMutation.isPending} variant="outline" className="w-full mt-4">
          {leaveMutation.isPending ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Leaving…</span>
          ) : (
            'Leave Waitlist'
          )}
        </Button>
      </Card>
    </div>
  );
};

export default WaitlistStatus;
