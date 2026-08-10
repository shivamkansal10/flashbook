import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const HowItWorks = () => {
  const steps = [
    { num: '01', title: 'Browse & Select Event', desc: 'Find live concerts, sports, and tech conferences. View real-time availability and tier pricing.' },
    { num: '02', title: 'Interactive Seat Map', desc: 'Pick your exact seats on our real-time SVG grid map with instant section filtering.' },
    { num: '03', title: '10-Minute Redis Hold', desc: 'Once selected, your seats are locked in Redis for 10 minutes, preventing double-booking.' },
    { num: '04', title: 'Instant Checkout & Pass', desc: 'Complete payment via Razorpay to immediately receive your QR code digital ticket.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="accent">Platform Architecture</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">How FlashBook Works</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Our high-concurrency ticket engine ensures fair distribution, zero race conditions, and real-time interactive reservations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {steps.map((step) => (
          <Card key={step.num} className="relative overflow-hidden">
            <CardHeader>
              <span className="text-4xl font-black text-accent/20 mb-1">{step.num}</span>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
