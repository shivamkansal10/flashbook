import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useEvent } from '../hooks/useEvent';
import { useCreateVenue, useVenues } from '../hooks/useVenues';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

// Zod schema matching EventRequest DTO
const eventSchema = z.object({
  name: z.string().min(1, { message: 'Event name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  venueId: z.coerce.number().positive({ message: 'Venue ID must be a positive number' }),
  startTime: z.string().refine((val) => {
    const parsed = Date.parse(val);
    return !isNaN(parsed) && parsed > Date.now();
  }, {
    message: 'Start time must be in the future',
  }),
  category: z.string().min(1, { message: 'Category is required' }),
  imageUrl: z.string().optional().or(z.literal('')),
});

const getMinDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localNow = new Date(now.getTime() - offset * 60 * 1000);
  return localNow.toISOString().slice(0, 16);
};

const getErrorMessage = (error) => {
  if (!error) return null;
  const data = error.response?.data;
  if (data) {
    if (data.error === 'VALIDATION_FAILED' && data.details) {
      return Object.entries(data.details)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
    }
    return data.message || data.error || "Server error";
  }
  return error.message || "An unexpected error occurred.";
};

export default function CreateEditEvent() {
  const navigate = useNavigate();
  const { id } = useParams(); // undefined for create flow
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueCapacity, setNewVenueCapacity] = useState('');
  const [venueError, setVenueError] = useState(null);

  const createVenueMutation = useCreateVenue();
  const { data: venues = [], isLoading: isVenuesLoading } = useVenues();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(eventSchema) });

  // Fetch event data when editing
  const { data: eventData, isLoading: isEventLoading, error: eventError } = useEvent(id);

  const status = eventData?.status ?? null; // EventStatus enum from backend
  const isDisabled = isEdit && status !== 'DRAFT';

  // Populate form when data is ready (edit mode)
  useEffect(() => {
    if (isEdit && eventData) {
      reset({
        name: eventData.name ?? '',
        description: eventData.description ?? '',
        venueId: eventData.venue?.id ?? '',
        startTime: eventData.startTime ? new Date(eventData.startTime).toISOString().slice(0, 16) : '',
        category: eventData.category ?? 'CONCERT',
        imageUrl: eventData.imageUrl ?? '',
      });
    }
  }, [isEdit, eventData, reset]);

  // Mutation for creating a new event
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/organizer/events', payload);
      return response.data; // expects EventResponse with id
    },
    onSuccess: (data) => {
      // Append new event id to localStorage array
      const stored = localStorage.getItem('flashbook_organizer_events');
      let ids = [];
      try {
        ids = stored ? JSON.parse(stored) : [];
      } catch {
        ids = [];
      }
      ids.push(data.id);
      localStorage.setItem('flashbook_organizer_events', JSON.stringify(ids));
      // Invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Navigate to seat‑map for the fresh event
      navigate(`/organizer/events/${data.id}/seat-map`);
    },
  });

  // Mutation for updating event details
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(`/organizer/events/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/organizer');
    },
  });

  // Mutation for publishing an event (edit flow only)
  const publishMutation = useMutation({
    mutationFn: async (eventId) => {
      await api.post(`/organizer/events/${eventId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setVenueError(null);
    if (!newVenueName || !newVenueCity || !newVenueAddress || !newVenueCapacity) {
      setVenueError("All fields are required");
      return;
    }
    try {
      const newVenue = await createVenueMutation.mutateAsync({
        name: newVenueName,
        city: newVenueCity,
        address: newVenueAddress,
        totalCapacity: parseInt(newVenueCapacity, 10),
      });
      setValue('venueId', newVenue.id);
      setIsVenueDialogOpen(false);
      setNewVenueName('');
      setNewVenueCity('');
      setNewVenueAddress('');
      setNewVenueCapacity('');
    } catch (err) {
      setVenueError(err.response?.data?.message || err.message || "Failed to create venue");
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
    };
    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  if (isEdit && isEventLoading) {
    return (
      <div className="p-4 space-y-2 text-center">
        <p>Loading event details…</p>
      </div>
    );
  }

  if (isEdit && eventError) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Failed to load event.</p>
        <Button onClick={() => navigate('/organizer')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto my-8 p-6 bg-white shadow-xl border-zinc-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEdit ? (isDisabled ? 'Event Details (View Only)' : 'Edit Event Details') : 'Create New Event'}</CardTitle>
        {isEdit && status && (
          <Badge variant="secondary" className="ml-2 capitalize">
            {status.toLowerCase()}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-4 text-sm">
            <strong>Error:</strong> {getErrorMessage(createMutation.error)}
          </div>
        )}
        {updateMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-4 text-sm">
            <strong>Error:</strong> {getErrorMessage(updateMutation.error)}
          </div>
        )}
        {publishMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-4 text-sm">
            <strong>Error:</strong> {getErrorMessage(publishMutation.error)}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <Input
                {...register('name')}
                disabled={isDisabled}
                placeholder="Enter event name"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                {...register('description')}
                disabled={isDisabled}
                placeholder="Enter description"
                type="text"
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                {...register('category')}
                disabled={isDisabled}
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
              >
                <option value="CONCERT">CONCERT</option>
                <option value="SPORTS">SPORTS</option>
                <option value="THEATRE">THEATRE</option>
                <option value="COMEDY">COMEDY</option>
                <option value="CONFERENCE">CONFERENCE</option>
                <option value="OTHER">OTHER</option>
              </select>
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                {...register('imageUrl')}
                disabled={isDisabled}
                placeholder="https://example.com/image.jpg"
              />
              {errors.imageUrl && <p className="text-sm text-red-600">{errors.imageUrl.message}</p>}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Venue</label>
                {!isDisabled && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs font-bold text-primary hover:no-underline"
                    onClick={() => setIsVenueDialogOpen(true)}
                  >
                    + Add New Venue
                  </Button>
                )}
              </div>
              {isVenuesLoading ? (
                <p className="text-xs text-muted-foreground">Loading venues...</p>
              ) : (
                <select
                  {...register('venueId')}
                  disabled={isDisabled}
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
                >
                  <option value="">Select a Venue</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city})
                    </option>
                  ))}
                </select>
              )}
              {errors.venueId && <p className="text-sm text-red-600">{errors.venueId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <Input
                {...register('startTime')}
                disabled={isDisabled}
                type="datetime-local"
                min={getMinDateTime()}
              />
              {errors.startTime && <p className="text-sm text-red-600">{errors.startTime.message}</p>}
            </div>
          </div>
          <CardFooter className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/organizer')}>
              Cancel
            </Button>
            {/* Create or Save changes button */}
            {!isDisabled && (
              <Button type="submit" disabled={isSubmitting || createMutation.isLoading || updateMutation.isLoading}>
                {isSubmitting || createMutation.isLoading || updateMutation.isLoading ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Event')}
              </Button>
            )}
            {/* Edit flow – publish only when draft */}
            {isEdit && status === 'DRAFT' && (
              <Button
                type="button"
                variant="destructive"
                disabled={publishMutation.isLoading}
                onClick={() => publishMutation.mutateAsync(id)}
              >
                {publishMutation.isLoading ? 'Publishing…' : 'Publish Event'}
              </Button>
            )}
          </CardFooter>
        </form>
        {isEdit && isDisabled && (
          <p className="mt-4 text-muted-foreground text-sm text-center">
            This event is already published or completed and details cannot be modified.
          </p>
        )}
      </CardContent>
    </Card>

    <Dialog open={isVenueDialogOpen} onOpenChange={setIsVenueDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Venue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateVenue} className="space-y-4 py-4">
          {venueError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-xs">
              {venueError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1">Venue Name</label>
            <Input
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              placeholder="e.g. Brilliant Convention Centre"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">City</label>
            <Input
              value={newVenueCity}
              onChange={(e) => setNewVenueCity(e.target.value)}
              placeholder="e.g. Indore"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Address</label>
            <Input
              value={newVenueAddress}
              onChange={(e) => setNewVenueAddress(e.target.value)}
              placeholder="e.g. 123 Main Street"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Total Capacity</label>
            <Input
              type="number"
              value={newVenueCapacity}
              onChange={(e) => setNewVenueCapacity(e.target.value)}
              placeholder="e.g. 2000"
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsVenueDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVenueMutation.isPending}>
              {createVenueMutation.isPending ? 'Saving…' : 'Save Venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
