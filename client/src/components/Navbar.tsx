import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  SignOut, 
  Moon, 
  Sun, 
  ShieldCheck, 
  CaretDown,
  CheckCircle,
  House,
  Bed,
  SquaresFour,
  CalendarCheck,
  UserCheck,
  LockKey
} from '@phosphor-icons/react';

export const Navbar: React.FC = () => {
  const { user, token, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState<boolean>(document.documentElement.classList.contains('dark'));
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  const isStaff = user && (user.role === 'Admin' || user.role === 'Manager' || user.role === 'Receptionist');

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
  };

  return (
    <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 transition-colors ${
      isStaff 
        ? 'bg-acc-950 text-white border-acc-800' 
        : 'bg-white dark:bg-acc-900 border-acc-200 dark:border-acc-800 text-acc-950 dark:text-acc-50'
    }`}>
      {/* Brand / Logo Title */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className={`w-8 h-8 rounded flex items-center justify-center font-bold font-mono text-sm tracking-tighter shadow-sm ${
            isStaff ? 'bg-brand-500 text-acc-950' : 'bg-brand-900 text-white dark:bg-brand-500 dark:text-acc-950'
          }`}>
            H.c
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight group-hover:text-brand-400 transition-colors">
                Hotel.com
              </h1>
              {isStaff && (
                <span className="badge-pill bg-brand-500 text-acc-950 font-mono text-[8px] font-bold">
                  ADMIN PANEL
                </span>
              )}
            </div>
            <p className={`text-[10px] font-mono ${isStaff ? 'text-acc-400' : 'text-acc-500 dark:text-acc-400'}`}>
              {isStaff ? 'Operations & Inventory Management' : 'Hotel booking, made effortlessly simple'}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
            isStaff ? 'text-acc-300 hover:bg-acc-850' : 'text-acc-700 dark:text-acc-300 hover:bg-acc-100 dark:hover:bg-acc-800'
          }`}
        >
          <House size={16} />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <Link
          to="/hotels"
          className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
            isStaff ? 'text-acc-300 hover:bg-acc-850' : 'text-acc-700 dark:text-acc-300 hover:bg-acc-100 dark:hover:bg-acc-800'
          }`}
        >
          <Bed size={16} />
          <span className="hidden sm:inline">Hotels</span>
        </Link>

        {/* Customer Dashboard Link */}
        <Link
          to="/my-bookings"
          className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
            isStaff ? 'text-acc-300 hover:bg-acc-850' : 'text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-500/10'
          }`}
        >
          <CalendarCheck size={16} />
          <span>My Bookings</span>
        </Link>

        {/* Staff-Only Control Dashboard & Role Switcher */}
        {isStaff ? (
          <>
            <Link
              to="/dashboard"
              className="px-3 py-1.5 bg-brand-500 text-acc-950 font-bold text-xs rounded font-mono flex items-center gap-1.5 shadow"
            >
              <SquaresFour size={16} />
              <span>Admin Dashboard</span>
            </Link>

            {/* Role Context Switcher (Only visible to staff) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-acc-700 text-xs font-mono bg-acc-900 text-white hover:bg-acc-800 transition-colors"
              >
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Role: <strong className="text-brand-400 font-semibold">{user.role}</strong></span>
                <CaretDown size={12} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-acc-900 border border-acc-700 rounded-md shadow-lg py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-acc-400 border-b border-acc-800">
                    Switch Staff Context
                  </div>
                  {(['Admin', 'Receptionist', 'Manager'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-acc-800 ${
                        user.role === role ? 'font-semibold text-emerald-400 bg-acc-800/50' : 'text-acc-300'
                      }`}
                    >
                      <span>{role}</span>
                      {user.role === role && <CheckCircle size={14} weight="fill" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded transition-colors ${
            isStaff ? 'text-acc-300 hover:bg-acc-850' : 'text-acc-600 dark:text-acc-300 hover:bg-acc-100 dark:hover:bg-acc-800'
          }`}
          title="Toggle Dark / Light Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Account State: Staff Profile Pill or Guest Login & Staff Portal Login Buttons */}
        <div className={`flex items-center gap-3 pl-3 border-l ${isStaff ? 'border-acc-800' : 'border-acc-200 dark:border-acc-800'}`}>
          {token && user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">{user.name}</p>
                <p className={`text-[10px] font-mono ${isStaff ? 'text-acc-400' : 'text-acc-500'}`}>{user.username}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-acc-400 hover:text-red-400 rounded transition-colors"
                title="Log Out"
              >
                <SignOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/guest-login"
                className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-acc-950 font-bold text-xs rounded transition-colors flex items-center gap-1 font-mono shadow-sm"
              >
                <UserCheck size={14} />
                <span>Guest Login</span>
              </Link>
              <Link
                to="/login"
                className="px-2.5 py-1.5 border border-acc-300 dark:border-acc-700 text-acc-700 dark:text-acc-300 hover:bg-acc-100 dark:hover:bg-acc-800 font-semibold text-xs rounded transition-colors flex items-center gap-1 font-mono"
                title="Staff Portal Sign In"
              >
                <LockKey size={13} />
                <span className="hidden md:inline">Portal Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
