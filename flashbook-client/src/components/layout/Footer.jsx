import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-zinc-200/80 bg-white py-12">
      <div className="container px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-lg font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span>Flash<span className="text-accent">Book</span></span>
          </div>

          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} FlashBook Inc. High-concurrency flash sale ticketing platform.
          </p>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/how-it-works" className="hover:text-foreground">How It Works</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/events" className="hover:text-foreground">Events</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
