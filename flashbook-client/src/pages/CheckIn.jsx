import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScanLine, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const CheckIn = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [ticketCode, setTicketCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedInBooking, setCheckedInBooking] = useState(null);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    setLoading(true);
    setError('');
    setScanned(false);

    try {
      const res = await api.post(`/organizer/bookings/check-in/${ticketCode.trim()}`);
      setCheckedInBooking(res.data);
      setScanned(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify ticket. Please check the ticket code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="text-center shadow-xl border-zinc-200">
        <CardHeader className="space-y-2">
          <Badge variant="accent" className="w-fit mx-auto">CHECK-IN PORTAL</Badge>
          <CardTitle className="text-2xl font-extrabold">Check-In Portal</CardTitle>
          <CardDescription>Event #{eventId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-44 w-full bg-zinc-900 rounded-2xl flex items-center justify-center text-white flex-col space-y-2">
            <ScanLine className="h-16 w-16 text-accent animate-pulse" />
            <span className="text-xs text-zinc-400">Enter ticket code from QR (or booking reference)...</span>
          </div>

          {scanned && checkedInBooking ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-sm space-y-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="font-bold">Check-In Successful!</p>
              <p className="text-xs">Ticket code <span className="font-mono font-bold">{ticketCode}</span> validated for entry.</p>
              <div className="text-xs text-emerald-700 bg-white/60 p-2.5 rounded-lg border border-emerald-100 mt-2 space-y-0.5 text-left font-medium">
                <p><strong>Guest:</strong> {checkedInBooking.userEmail}</p>
                <p><strong>Seats:</strong> {checkedInBooking.seatLabels?.join(', ')}</p>
                <p><strong>Event:</strong> {checkedInBooking.eventName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setScanned(false); setTicketCode(''); setCheckedInBooking(null); }} className="mt-3">
                Check In Next Guest
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-3">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}
              <Input
                placeholder="Enter ticket code from QR or booking reference..."
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" variant="accent" className="w-full" disabled={loading || !ticketCode.trim()}>
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  'Verify Ticket'
                )}
              </Button>
            </form>
          )}

          <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => navigate('/organizer')}>
            Exit Scanner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIn;
