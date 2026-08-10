import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
      accent: 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      outline: 'border border-input bg-background hover:bg-secondary hover:text-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-secondary hover:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-11 px-6 py-2.5',
      sm: 'h-9 px-4 text-xs',
      lg: 'h-13 px-8 text-base font-bold',
      icon: 'h-11 w-11',
    };

    return (
      <Comp
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
