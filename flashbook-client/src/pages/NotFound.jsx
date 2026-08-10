import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md text-center shadow-xl border-zinc-200 bg-white">
        <CardHeader className="space-y-2">
          <span className="text-6xl font-black text-accent">404</span>
          <CardTitle className="text-2xl font-extrabold">Page Not Found</CardTitle>
          <CardDescription>
            The page you are looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button variant="accent" className="w-full" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
