import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import EventFilters from '../components/events/EventFilters';
import EventCard from '../components/events/EventCard';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AlertCircle, RefreshCw, Ticket, Sparkles } from 'lucide-react';

const Events = () => {
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 9;

  // Filter params sent to backend
  const filterParams = {
    category,
    city,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    page,
    size: pageSize,
  };

  const { data, isLoading, isError, refetch } = useEvents(filterParams);

  // Extract page fields from Spring Page<EventResponse>
  const eventsContent = Array.isArray(data) ? data : (data?.content || []);
  const totalPages = data?.totalPages || (eventsContent.length > 0 ? 1 : 0);

  // Client-side search filtering on name/title
  const filteredEvents = eventsContent.filter((event) => {
    if (!searchQuery.trim()) return true;
    const name = event.name || event.title || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // Filter Change Handlers (Reset page to 0)
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setPage(0);
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(0);
  };

  const handleCityChange = (val) => {
    setCity(val);
    setPage(0);
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    setPage(0);
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setPage(0);
  };

  const handleClearFilters = () => {
    setCategory('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setPage(0);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-orange-500" /> Discover Events
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Browse upcoming concerts, sports matches, and live performances with real-time seat locks.
        </p>
      </div>

      {/* Filter Component */}
      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        city={city}
        onCityChange={handleCityChange}
        startDate={startDate}
        onStartDateChange={handleStartDateChange}
        endDate={endDate}
        onEndDateChange={handleEndDateChange}
        onClearFilters={handleClearFilters}
      />

      {/* Content Section */}
      {isLoading ? (
        /* Loading Skeletons - 6 Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="space-y-3 p-4 rounded-2xl border-zinc-200/80 bg-white">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center pt-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        /* Error Banner with Retry */
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4 max-w-md mx-auto my-8">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 text-lg">Failed to load events</h3>
            <p className="text-xs text-red-600 mt-1">
              Unable to connect to the backend server. Please check your connection and try again.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-red-300 text-red-700 hover:bg-red-100 rounded-full font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-8">
          <div className="h-16 w-16 rounded-full bg-zinc-100 text-muted-foreground flex items-center justify-center mx-auto">
            <Ticket className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-xl">No events found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              No upcoming events match your current filter parameters or search term.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleClearFilters}
            className="rounded-full font-bold px-6 bg-primary text-white"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        /* Events Grid & Pagination */
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <span className="text-xs text-muted-foreground font-semibold mr-2">Page</span>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(i)}
                  className={`w-9 h-9 p-0 rounded-full font-bold text-xs transition-all ${
                    page === i
                      ? 'bg-primary text-white shadow-sm'
                      : 'border-zinc-300 text-foreground hover:bg-zinc-100'
                  }`}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Events;
