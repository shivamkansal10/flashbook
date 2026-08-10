import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container px-4 sm:px-8 py-8">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
