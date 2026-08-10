import React from 'react';
import { EVENT_CATEGORIES } from '../../utils/constants';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Calendar, FilterX, Layers } from 'lucide-react';

const EventFilters = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  city,
  onCityChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Search Input (Client-side name filter) */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-xl border-zinc-300 focus:border-black focus:ring-black text-sm"
          />
        </div>

        {/* Category Select */}
        <div>
          <Select
            value={category || 'ALL'}
            onValueChange={(val) => onCategoryChange(val === 'ALL' ? '' : val)}
          >
            <SelectTrigger className="h-11 rounded-xl border-zinc-300 text-sm">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-500 shrink-0" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">All Categories</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Input */}
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
          <Input
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="pl-10 h-11 rounded-xl border-zinc-300 focus:border-black focus:ring-black text-sm"
          />
        </div>

        {/* Start Date Input */}
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
          <Input
            type="date"
            placeholder="From date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="pl-10 h-11 rounded-xl border-zinc-300 focus:border-black focus:ring-black text-sm text-foreground"
          />
        </div>

        {/* End Date Input */}
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
          <Input
            type="date"
            placeholder="To date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="pl-10 h-11 rounded-xl border-zinc-300 focus:border-black focus:ring-black text-sm text-foreground"
          />
        </div>
      </div>

      {/* Active Filters Reset Row */}
      {(searchQuery || category || city || startDate || endDate) && (
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 font-bold rounded-full"
          >
            <FilterX className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventFilters;
