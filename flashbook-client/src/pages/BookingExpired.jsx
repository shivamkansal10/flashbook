import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Clock } from 'lucide-react';

const BookingExpired = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md text-center shadow-xl border-amber-200/80 bg-white">
        <CardHeader className="space-y-2">
          <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-2">
            <Clock className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-extrabold">Your seat hold expired</CardTitle>
          <CardDescription>
            You didn't complete checkout in time, so your seats were released back to availability.
            Browse events to try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button
            className="w-full bg-primary text-white hover:bg-zinc-800 rounded-full font-bold"
            onClick={() => navigate('/events')}
          >
            Browse Events
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingExpired;
