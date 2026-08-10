import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/events';

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ email, password }) => {
      return await login(email, password);
    },
    onSuccess: () => {
      navigate(from, { replace: true });
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-8 px-4 relative">
      {/* Main Container */}
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Logo Header */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            Flash<span className="text-orange-500">Book</span>
          </span>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-lg p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">
            Welcome back
          </h1>

          {/* Inline Error Banner */}
          {mutation.isError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>Invalid email or password.</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={mutation.isPending}
                        className="h-12 rounded-xl border-zinc-300 focus:border-black focus:ring-black text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Password
                      </FormLabel>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          disabled={mutation.isPending}
                          className="h-12 rounded-xl border-zinc-300 focus:border-black focus:ring-black pr-11 text-sm"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className="mt-1 flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white rounded-full h-12 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors shadow-sm mt-2"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Logging in...
                  </span>
                ) : (
                  'Log In'
                )}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="my-6 relative">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-muted-foreground font-medium">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
