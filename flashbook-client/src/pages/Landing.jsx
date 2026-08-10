import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Search, CreditCard, Check, Calendar, MapPin, Sparkles, Armchair } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Prefetch/fetch top events (page=0, size=6)
  const { data, isLoading, isError } = useEvents({ page: 0, size: 6 });

  // Handle both flat array and Spring Data Page response shapes
  const eventsList = Array.isArray(data) ? data : (data?.content || []);

  const handleActionClick = () => {
    if (isAuthenticated) {
      navigate('/events');
    } else {
      navigate('/register');
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section - Two columns on desktop, stacked on mobile */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground font-sans">
            Book tickets before <br className="hidden sm:inline" />
            <span className="text-orange-500">they're gone</span> <br className="hidden sm:inline" />
            in seconds.
          </h1>

          <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
            The fastest way to secure seats for concerts, sports, and live shows. Real-time availability, zero overselling, instant confirmation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button variant="default" size="lg" className="px-8 py-6 rounded-full font-bold text-base shadow-sm" onClick={handleActionClick}>
              Browse Events
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 rounded-full font-bold text-base border-zinc-900 text-zinc-900 hover:bg-zinc-100" onClick={() => navigate('/how-it-works')}>
              How It Works
            </Button>
          </div>
        </div>

        {/* Hero Visual - Browser Mockup & Floating Badges */}
        <div className="relative pt-6 lg:pt-0">
          {/* Main Browser Mockup Container */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Mockup Top Bar */}
            <div className="bg-zinc-100 px-4 py-3 flex items-center gap-2 border-b border-zinc-200">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>
            </div>

            {/* Mockup Content Grid */}
            <div className="p-4 grid grid-cols-2 gap-4 bg-zinc-50/50">
              {/* Card 1 */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="h-24 bg-zinc-100 relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Summer Sounds Fest"
                    src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="p-3 flex flex-col gap-0.5">
                  <span className="font-bold text-sm text-foreground">Summer Sounds Fest</span>
                  <span className="text-xs text-muted-foreground">Central Park • Aug 12</span>
                  <span className="font-bold text-sm text-orange-500 mt-1">From ₹85</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="h-24 bg-zinc-100 relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Championship Finals"
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="p-3 flex flex-col gap-0.5">
                  <span className="font-bold text-sm text-foreground">Championship Finals</span>
                  <span className="text-xs text-muted-foreground">Metro Arena • Sep 04</span>
                  <span className="font-bold text-sm text-orange-500 mt-1">From ₹150</span>
                </div>
              </div>

              {/* Card 3 (Full Width) */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm col-span-2">
                <div className="h-24 bg-zinc-100 relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Symphony in D Minor"
                    src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80"
                  />
                </div>
                <div className="p-3 flex flex-col gap-0.5">
                  <span className="font-bold text-sm text-foreground">Symphony in D Minor</span>
                  <span className="text-xs text-muted-foreground">Grand Hall • Oct 22</span>
                  <span className="font-bold text-sm text-orange-500 mt-1">From ₹110</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Badge Top Right */}
          <div className="absolute -top-4 -right-2 sm:-right-4 bg-white border border-zinc-200 rounded-2xl p-3 shadow-lg flex items-center gap-3 z-10">
            <div className="flex -space-x-2">
              <img
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="User 1"
              />
              <img
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="User 2"
              />
              <img
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                alt="User 3"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-foreground">12k+</span>
              <span className="text-[10px] text-muted-foreground">Tickets Booked</span>
            </div>
          </div>

          {/* Floating Badge Bottom Left */}
          <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white border border-zinc-200 rounded-2xl p-3 shadow-lg flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-foreground">Seat Locked</span>
              <span className="text-[10px] text-muted-foreground">in Real-Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Events Section */}
      {!isError && (
        <section className="space-y-6 pt-4 border-t border-zinc-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-orange-500" /> Trending Events
              </h2>
              <p className="text-sm text-muted-foreground">High-demand concerts and live events available right now</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full border-zinc-300" onClick={() => navigate('/events')}>
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="space-y-3 p-4 rounded-2xl">
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : eventsList && eventsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map((event) => {
                const title = event.name || event.title || 'Upcoming Event';
                const venueName = typeof event.venue === 'object' ? event.venue?.name : event.venue;
                const venueCity = typeof event.venue === 'object' ? event.venue?.city : '';
                const venueText = [venueName, venueCity].filter(Boolean).join(', ') || 'Venue TBA';
                const price = event.priceFrom ?? event.minPrice ?? 0;

                return (
                  <Card
                    key={event.id}
                    className="group cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border-zinc-200/80 rounded-2xl bg-white"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div>
                      <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                        <img
                          src={event.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800'}
                          alt={title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {event.status && (
                          <Badge variant="accent" className="absolute top-3 right-3 shadow-md bg-orange-500 text-white border-0 text-[10px] font-bold">
                            {event.status}
                          </Badge>
                        )}
                      </div>

                      <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-xl font-extrabold group-hover:text-orange-500 transition-colors line-clamp-1">
                          {title}
                        </CardTitle>
                        <CardDescription className="space-y-1.5 pt-1">
                          {event.startTime && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-orange-500 shrink-0" />
                              {formatEventDate(event.startTime)}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-orange-500 shrink-0" />
                            <span className="line-clamp-1">{venueText}</span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                    </div>

                    <CardFooter className="p-5 pt-3 flex items-center justify-between border-t border-zinc-100">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">Starting</span>
                        <p className="text-lg font-black text-foreground">From ₹{price}</p>
                      </div>
                      <Button variant="accent" size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-5">
                        View Seats
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      {/* How It Works Section */}
      <section className="pt-8">
        <h2 className="text-3xl font-extrabold text-foreground text-center mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-foreground border border-zinc-200 shadow-sm">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg text-foreground">1. Browse</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Discover top events, concerts, and games tailored to your location and preferences.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-foreground border border-zinc-200 shadow-sm">
              <Armchair className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg text-foreground">2. Reserve</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Select your ideal seats with our interactive map. We lock them instantly to prevent double-booking.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-foreground border border-zinc-200 shadow-sm">
              <CreditCard className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg text-foreground">3. Pay</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Complete your purchase securely. Your digital tickets are delivered immediately to your app.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
