import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-xl border-zinc-200 bg-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-extrabold">Reset password</CardTitle>
          <CardDescription>
            Enter your account email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">Reset link sent!</p>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, you will receive password reset instructions shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="accent" className="w-full">
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-100 pt-4">
          <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
