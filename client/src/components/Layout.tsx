import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Public customer routes where sidebar is omitted for guests
  const isPublicGuestRoute = location.pathname === '/' || location.pathname === '/register' || location.pathname === '/login' || location.pathname === '/my-bookings';
  
  // Staff users (Admin, Manager, Receptionist) see sidebar on all management pages including /hotels
  const isStaffRole = user && (user.role === 'Admin' || user.role === 'Manager' || user.role === 'Receptionist');
  const showSidebar = isStaffRole && !isPublicGuestRoute;
  const showFooter = !showSidebar;

  return (
    <div className="min-h-screen bg-acc-50 dark:bg-acc-950 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        <main key={location.pathname} className={`flex-1 p-6 md:p-8 overflow-y-auto page-fade-enter ${!showSidebar ? 'max-w-6xl mx-auto w-full' : 'max-w-[1400px]'}`}>
          <Outlet />
        </main>
      </div>
      {showFooter && <Footer />}
    </div>
  );
};
