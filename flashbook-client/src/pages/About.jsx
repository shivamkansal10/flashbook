import React from 'react';
import { CtaBand } from '../components/shared/CtaBand';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {/* Hero Section */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">About Flashbook</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Flashbook is a modern ticketing platform that connects fans with the events they love. Our mission is to make ticket discovery, reservation, and payment fast, secure, and enjoyable.
        </p>
      </header>

      {/* Content Sections */}
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Story</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Flashbook was built to solve a real engineering problem: how do you sell 50 concert seats to 500 people trying to book them at the exact same second, without overselling a single one? Most ticketing systems either buckle under real demand or quietly oversell and sort it out later. This one doesn't — every seat hold is backed by distributed locking and atomic inventory checks, proven under real concurrent load, not just claimed.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Browse events, select your seats on an interactive map, and pay securely in seconds. Your tickets are delivered instantly to the app, ready for entry.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why Choose Flashbook?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>Real‑time seat locking to prevent double‑bookings.</li>
              <li>Transparent pricing with no hidden fees.</li>
              <li>Instant digital tickets delivered to your phone.</li>
              <li>Secure payment processing and reliable customer support.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Reuse CTA band */}
      <CtaBand />
    </div>
  );
};

export default About;
