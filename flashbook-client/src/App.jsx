import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Shared Route Guards
import ProtectedRoute from './components/shared/ProtectedRoute';
import OrganizerRoute from './components/shared/OrganizerRoute';
import AdminRoute from './components/shared/AdminRoute';

// Public Pages
import Landing from './pages/Landing';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import SoldOut from './pages/SoldOut';
import SessionExpired from './pages/SessionExpired';
import BookingExpired from './pages/BookingExpired';
import NotFound from './pages/NotFound';

// Protected User Pages
import SeatSelection from './pages/SeatSelection';
import BookingSummary from './pages/BookingSummary';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';
import PaymentFailed from './pages/PaymentFailed';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import WaitlistStatus from './pages/WaitlistStatus';
import Profile from './pages/Profile';

// Organizer Pages
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEditEvent from './pages/CreateEditEvent';
import SeatMapBuilder from './pages/SeatMapBuilder';
import CheckIn from './pages/CheckIn';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/sold-out" element={<SoldOut />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/booking-expired" element={<BookingExpired />} />

        {/* Protected Routes (USER+) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/events/:id/seats" element={<SeatSelection />} />
          <Route path="/booking-summary/:bookingId" element={<BookingSummary />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
          <Route path="/confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/waitlist/:eventId" element={<WaitlistStatus />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Organizer Routes (ORGANIZER, ADMIN) */}
        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/organizer/events/new" element={<CreateEditEvent />} />
          <Route path="/organizer/events/:id/edit" element={<CreateEditEvent />} />
          <Route path="/organizer/events/:id/seat-map" element={<SeatMapBuilder />} />
          <Route path="/organizer/check-in/:eventId" element={<CheckIn />} />
        </Route>

        {/* Admin Routes (ADMIN) */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
