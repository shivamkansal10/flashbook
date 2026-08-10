import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Zap, Ticket, User, LogOut, Shield, CalendarPlus } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span>Flash<span className="text-accent">Book</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {hasRole('ADMIN') && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-1.5 text-accent" />
                  Admin
                </Button>
              )}
              {(hasRole('ORGANIZER') || hasRole('ADMIN')) && (
                <Button variant="outline" size="sm" onClick={() => navigate('/organizer')}>
                  <CalendarPlus className="h-4 w-4 mr-1.5 text-accent" />
                  Organizer
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-bookings')}>
                <Ticket className="h-4 w-4 mr-1.5" />
                Bookings
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-1.5" />
                {user?.fullName || 'Profile'}
                {user?.role && (
                  <Badge variant="accent" className="ml-2 py-0 px-1.5 text-[10px]">
                    {user.role}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="accent" size="sm" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
