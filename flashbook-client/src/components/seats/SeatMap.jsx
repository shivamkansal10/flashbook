import React from 'react';

const SeatMap = ({ seats = [], selectedSeatIds = [], onToggleSeat, disabled = false }) => {
  // Parse row letter & number from seat label (e.g., "A1" -> row: "A", num: "1")
  const parseSeatLabel = (label = '') => {
    const match = label.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      return { row: match[1].toUpperCase(), num: parseInt(match[2], 10) };
    }
    return { row: 'OTHER', num: label };
  };

  // Group seats by Row letter
  const rowsMap = seats.reduce((acc, seat) => {
    const { row } = parseSeatLabel(seat.label);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  // Sort rows alphabetically
  const sortedRowKeys = Object.keys(rowsMap).sort();

  return (
    <div className="w-full flex flex-col items-center space-y-8">
      {/* Curved Stage Visualization Header */}
      <div className="w-full bg-zinc-200 h-2.5 rounded-t-[50%] shadow-inner border border-zinc-300 flex items-center justify-center relative my-2">
        <span className="absolute top-4 text-[11px] font-extrabold text-muted-foreground tracking-[0.25em] uppercase">
          STAGE
        </span>
      </div>

      {/* Seat Grid Container */}
      <div className="w-full bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-sm overflow-x-auto flex flex-col items-center space-y-4">
        {sortedRowKeys.map((rowKey) => {
          const rowSeats = rowsMap[rowKey].sort((a, b) => {
            const { num: numA } = parseSeatLabel(a.label);
            const { num: numB } = parseSeatLabel(b.label);
            return numA - numB;
          });

          return (
            <div key={rowKey} className="flex items-center gap-2 sm:gap-3">
              {/* Row Label */}
              <span className="w-6 text-center font-bold text-xs text-muted-foreground mr-2">
                {rowKey}
              </span>

              {/* Seats in Row */}
              <div className="flex items-center gap-2">
                {rowSeats.map((seat, index) => {
                  const { num } = parseSeatLabel(seat.label);
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isAvailable = seat.status === 'AVAILABLE';
                  const isHeld = seat.status === 'HELD';
                  const isSold = seat.status === 'SOLD';

                  // Add visual aisle gap every 4 seats
                  const isAisle = index > 0 && index % 4 === 0;

                  return (
                    <React.Fragment key={seat.id}>
                      {isAisle && <div className="w-4 sm:w-6" />}
                      <button
                        type="button"
                        disabled={disabled || !isAvailable}
                        onClick={() => onToggleSeat(seat.id)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-200 shadow-sm ${
                          isSelected
                            ? 'bg-black border border-black text-white shadow-md scale-105'
                            : isSold
                            ? 'bg-zinc-200 border border-zinc-300 text-zinc-400 opacity-60 cursor-not-allowed'
                            : isHeld
                            ? 'bg-white border-2 border-orange-500 text-foreground cursor-not-allowed'
                            : 'bg-white border border-zinc-300 text-foreground hover:border-black hover:scale-105 active:scale-95'
                        }`}
                        title={`${seat.label} - ₹${seat.price} (${seat.status})`}
                      >
                        {num}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeatMap;
