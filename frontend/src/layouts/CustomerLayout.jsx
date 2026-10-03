import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Subtle Mobile & Desktop Footer (without any admin links) */}
      <footer className="bg-stone-900 text-stone-400 py-8 px-4 text-center text-xs border-t border-stone-800 hidden sm:block">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-serif text-stone-300 font-bold text-sm">
            Grand Palace Hotel & Suites
          </p>
          <p className="text-stone-500">
            Luxury Accommodations • 24/7 Concierge • Best Rate Guarantee
          </p>
          <p className="text-stone-600 text-[11px] pt-2">
            © {new Date().getFullYear()} Grand Palace Hotel. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
};

export default CustomerLayout;
