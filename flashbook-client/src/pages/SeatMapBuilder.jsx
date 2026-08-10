import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';

// Helper to generate seat labels like A1, A2, ... B1, B2, etc.
const generateSeatLabel = (index) => {
  const row = String.fromCharCode(65 + Math.floor(index / 10)); // 10 seats per row
  const number = (index % 10) + 1;
  return `${row}${number}`;
};

export default function SeatMapBuilder() {
  const { id } = useParams(); // event id
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading: eventLoading, isError: eventError } = useEvent(id);

  // Draft seats before saving
  const [draftSeats, setDraftSeats] = useState([]);
  // Seats returned from the backend after saving
  const [savedSeats, setSavedSeats] = useState([]);

  // Mutation to create seats
  const createSeatsMutation = useMutation({
    mutationFn: async (seats) => {
      const response = await api.post(`/organizer/events/${id}/seats`, seats);
      return response.data; // Expect SeatResponse[]
    },
    onSuccess: (data) => {
      setSavedSeats(data);
      // Invalidate seats query for this event
      queryClient.invalidateQueries({ queryKey: ['event', id, 'seats'] });
    },
    onError: (err) => console.error('Failed to save seats', err),
  });

  // Mutation to publish the event
  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/organizer/events/${id}/publish`);
    },
    onSuccess: () => {
      // Ensure id is stored for organizer dashboard
      const stored = localStorage.getItem('flashbook_organizer_events');
      let ids = [];
      try { ids = stored ? JSON.parse(stored) : []; } catch { ids = []; }
      if (!ids.includes(Number(id))) {
        ids.push(Number(id));
        localStorage.setItem('flashbook_organizer_events', JSON.stringify(ids));
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/organizer');
    },
    onError: (err) => console.error('Publish failed', err),
  });

  const handleAddRow = () => {
    const newSeat = { seatLabel: generateSeatLabel(draftSeats.length), price: '' };
    setDraftSeats([...draftSeats, newSeat]);
  };

  const handleDraftChange = (idx, field, value) => {
    setDraftSeats(draftSeats.map((seat, i) => i === idx ? { ...seat, [field]: value } : seat));
  };

  const handleSaveSeats = () => {
    const payload = draftSeats
      .filter((s) => s.seatLabel && s.price !== '')
      .map((s) => ({ seatLabel: s.seatLabel, price: Number(s.price) }));
    if (payload.length) createSeatsMutation.mutate(payload);
  };

  if (eventLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Failed to load event details.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto my-8 p-6">
      <CardHeader>
        <CardTitle>{event?.name ?? 'Untitled Event'} – Seat Map Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={handleAddRow} variant="secondary" className="mb-2">Add Row</Button>
          {draftSeats.map((seat, idx) => (
            <div key={idx} className="flex items-center space-x-2 mb-2">
              <Input value={seat.seatLabel} disabled className="w-24" />
              <Input
                placeholder="Price"
                type="number"
                value={seat.price}
                onChange={(e) => handleDraftChange(idx, 'price', e.target.value)}
                className="w-32"
              />
            </div>
          ))}
          {draftSeats.length > 0 && (
            <Button onClick={handleSaveSeats} variant="primary" disabled={createSeatsMutation.isLoading}>
              {createSeatsMutation.isLoading ? 'Saving…' : 'Save Seats'}
            </Button>
          )}
        </div>
        {savedSeats.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Saved Seats</h3>
            <div className="flex flex-wrap gap-2">
              {savedSeats.map((s) => (
                <Badge key={s.seatLabel} variant="secondary">{s.seatLabel} – ₹{s.price?.toFixed(2)}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => navigate('/organizer')}>Back to Dashboard</Button>
        {savedSeats.length > 0 && (
          <Button variant="destructive" onClick={() => publishMutation.mutate()} disabled={publishMutation.isLoading}>
            {publishMutation.isLoading ? 'Publishing…' : 'Publish Event'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
