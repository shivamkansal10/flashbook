import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Shield, Activity, AlertCircle } from 'lucide-react';
import { useRateLimitEvents } from '../hooks/useAdmin';

const AdminDashboard = () => {
  const { data, isLoading, isError } = useRateLimitEvents();

  const rateLimiters = data?.rateLimiters ?? {};
  const status = data?.status;
  const limiterEntries = Object.entries(rateLimiters);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <Badge variant="destructive" className="mb-1">ADMIN CONSOLE</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">System Oversight</h1>
        <p className="text-muted-foreground text-sm">Live rate-limiter metrics from backend services</p>
      </div>

      {/* Status Banner */}
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-accent" />
        {isLoading ? (
          <Skeleton className="h-5 w-32" />
        ) : isError ? (
          <span className="text-sm font-semibold text-red-600">Unable to reach backend</span>
        ) : (
          <span className="text-sm font-semibold">
            Resilience4j Status:{' '}
            <span className={status === 'ACTIVE' ? 'text-emerald-600' : 'text-yellow-600'}>
              {status}
            </span>
          </span>
        )}
      </div>

      {/* Rate Limiter Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 bg-white shadow-md border-zinc-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-6 bg-red-50 border-red-200 shadow-md">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">
              Failed to fetch rate-limit data. Ensure you are logged in as ADMIN and the backend is reachable.
            </p>
          </div>
        </Card>
      ) : limiterEntries.length === 0 ? (
        <Card className="p-6 bg-zinc-50 border-zinc-200 shadow-md text-center">
          <Activity className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">
            No rate limiters registered yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Resilience4j rate limiter instances will appear here once they are created by incoming traffic.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {limiterEntries.map(([name, metrics]) => (
            <Card key={name} className="p-4 bg-white shadow-md border-zinc-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium truncate max-w-[80%]" title={name}>
                  {name}
                </CardTitle>
                <Activity className="h-4 w-4 text-accent shrink-0" />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-black">
                  {metrics.availablePermissions}
                </div>
                <p className="text-xs text-muted-foreground">Available permissions</p>
                <p className="text-xs text-muted-foreground pt-1">
                  Waiting threads:{' '}
                  <span className={metrics.numberOfWaitingThreads > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {metrics.numberOfWaitingThreads}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* System Log Panel */}
      {!isLoading && !isError && (
        <Card className="bg-white shadow-md border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Rate Limiter Event Log</CardTitle>
            <CardDescription>Live snapshot from Resilience4j — auto-refreshes every 5 seconds</CardDescription>
          </CardHeader>
          <CardContent className="text-xs font-mono text-zinc-300 bg-zinc-900 p-4 rounded-2xl space-y-1.5 max-h-60 overflow-y-auto">
            {limiterEntries.length === 0 ? (
              <p className="text-zinc-500">[INFO] No rate limiters active.</p>
            ) : (
              limiterEntries.map(([name, metrics]) => (
                <p key={name}>
                  [INFO] <span className="text-accent">{name}</span> — availablePermissions=
                  <span className="text-emerald-400">{metrics.availablePermissions}</span>{' '}
                  waitingThreads=
                  <span className={metrics.numberOfWaitingThreads > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {metrics.numberOfWaitingThreads}
                  </span>
                </p>
              ))
            )}
            <p className="text-zinc-500 pt-1">[INFO] Status: {status}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
