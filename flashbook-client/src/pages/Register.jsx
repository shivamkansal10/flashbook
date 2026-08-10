import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => /\d/.test(val), 'Password must contain at least one number'),
});

const Register = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ fullName, email, password }) => {
      return await registerAuth(fullName, email, password);
    },
    onSuccess: () => {
      navigate('/events', { replace: true });
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

        {/* Register Card */}
        <div className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-lg p-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-6 leading-tight max-w-[220px] mx-auto">
            Create your account
          </h1>

          {/* Inline Error Banner */}
          {mutation.isError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>
                {mutation.error?.response?.status === 409
                  ? 'An account with this email already exists.'
                  : mutation.error?.response?.data?.message || 'An account with this email already exists.'}
              </span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        type="text"
                        autoComplete="name"
                        disabled={mutation.isPending}
                        className="h-12 rounded-xl border-zinc-300 focus:border-black focus:ring-black text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
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
                    <p className="text-[13px] text-muted-foreground font-medium pt-1">
                      At least 8 characters with a number
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white rounded-full h-12 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors shadow-sm mt-4"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>

          {/* Log In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
