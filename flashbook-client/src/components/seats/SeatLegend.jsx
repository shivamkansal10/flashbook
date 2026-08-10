import React from 'react';

const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-6 py-2 px-1 font-medium text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md bg-black border border-black shadow-sm" />
        <span className="font-semibold text-foreground">Selected</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md bg-white border border-zinc-300" />
        <span>Available</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md bg-zinc-200 border border-zinc-300 opacity-60" />
        <span>Sold</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md bg-white border-2 border-orange-500" />
        <span>Held by others</span>
      </div>
    </div>
  );
};

export default SeatLegend;
