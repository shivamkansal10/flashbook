import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { LogOut } from 'lucide-react';

const SessionExpired = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md text-center shadow-xl border-zinc-200 bg-white">
        <CardHeader className="space-y-2">
          <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-2">
            <LogOut className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-extrabold">Session Expired</CardTitle>
          <CardDescription>
            Your session has timed out or your security token is no longer valid. Please sign in again to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button variant="accent" className="w-full" onClick={() => navigate('/login')}>
            Sign In Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionExpired;
