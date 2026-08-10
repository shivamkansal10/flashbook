import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const HoldCountdown = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    let interval;
    const calculateTimeLeft = () => {
      const targetTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    };

    calculateTimeLeft();
    interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs shadow-sm">
      <Clock className="h-3.5 w-3.5 animate-pulse text-orange-500" />
      <span>Hold: {formattedTime}</span>
    </div>
  );
};

export default HoldCountdown;
