import * as React from 'react';
import { cn } from '@/lib/utils';

function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    accent: 'border-transparent bg-accent text-accent-foreground hover:bg-accent/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border-zinc-300',
    success: 'border-transparent bg-emerald-500 text-white',
    warning: 'border-transparent bg-amber-500 text-white',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
