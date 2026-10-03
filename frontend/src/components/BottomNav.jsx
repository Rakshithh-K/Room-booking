import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BedDouble, CalendarCheck, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-4 py-2 sm:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-amber-600 font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/rooms"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-amber-600 font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <BedDouble className="w-5 h-5" />
          <span>Rooms</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-amber-600 font-semibold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
