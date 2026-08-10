import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  House, 
  SquaresFour, 
  Buildings, 
  Bed, 
  Users, 
  UserGear, 
  CalendarCheck, 
  BellRinging, 
  Receipt, 
  CaretDown,
  ShieldCheck
} from '@phosphor-icons/react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentRole = user?.role || 'Admin';

  const [guestsOpen, setGuestsOpen] = useState(true);
  const [resOpen, setResOpen] = useState(true);

  return (
    <aside className="w-64 bg-acc-950 text-acc-100 border-r border-acc-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] text-xs font-sans">
      <div className="p-4 space-y-4">
        
        {/* Header Badge */}
        <div className="px-3 py-2 bg-acc-900 border border-acc-800 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-mono text-[10px] font-bold text-acc-200 tracking-wider">STAFF CONTROL PANEL</span>
          </div>
          <span className="badge-pill bg-brand-500 text-acc-950 font-mono text-[9px] font-bold">{currentRole}</span>
        </div>

        <nav className="space-y-1 font-sans">
          
          {/* Main Operations */}
          <div className="px-3 text-[10px] uppercase font-mono tracking-widest text-acc-500 font-semibold pt-1">
            Operations Center
          </div>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-acc-950 font-extrabold shadow'
                  : 'text-acc-300 hover:bg-acc-850 hover:text-white'
              }`
            }
          >
            <SquaresFour size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/hotels"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-acc-950 font-extrabold shadow'
                  : 'text-acc-300 hover:bg-acc-850 hover:text-white'
              }`
            }
          >
            <Buildings size={16} />
            <span>Hotel Branches</span>
          </NavLink>

          <NavLink
            to="/rooms"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-acc-950 font-extrabold shadow'
                  : 'text-acc-300 hover:bg-acc-850 hover:text-white'
              }`
            }
          >
            <Bed size={16} />
            <span>Room Inventory</span>
          </NavLink>

          {/* Guest & Booking Management */}
          <div className="px-3 text-[10px] uppercase font-mono tracking-widest text-acc-500 font-semibold pt-3">
            Guest Desk
          </div>

          <div>
            <button
              onClick={() => setGuestsOpen(!guestsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-acc-300 hover:bg-acc-850 hover:text-white ${
                location.pathname.startsWith('/guests') ? 'font-bold text-brand-400' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} />
                <span>Guests Directory</span>
              </div>
              <CaretDown size={12} className={`transition-transform ${guestsOpen ? 'rotate-180' : ''}`} />
            </button>

            {guestsOpen && (
              <div className="pl-7 pr-2 py-1 space-y-1 text-[11px] font-mono border-l border-acc-800 ml-4 my-1">
                <NavLink to="/guests?tab=register" className="block py-1 text-acc-300 hover:text-brand-400">
                  + Register New Guest
                </NavLink>
                <NavLink to="/guests?tab=list" className="block py-1 text-acc-300 hover:text-brand-400">
                  • Guest Directory List
                </NavLink>
                <NavLink to="/reservations/new" className="block py-1 text-emerald-400 font-semibold hover:underline">
                  ➔ Book Room for Guest
                </NavLink>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setResOpen(!resOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-acc-300 hover:bg-acc-850 hover:text-white ${
                location.pathname.startsWith('/reservations') ? 'font-bold text-brand-400' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck size={16} />
                <span>Reservations</span>
              </div>
              <CaretDown size={12} className={`transition-transform ${resOpen ? 'rotate-180' : ''}`} />
            </button>

            {resOpen && (
              <div className="pl-7 pr-2 py-1 space-y-1 text-[11px] font-mono border-l border-acc-800 ml-4 my-1">
                <NavLink to="/reservations/new" className="block py-1 text-brand-400 font-semibold hover:underline">
                  ✦ 6-Step Booking Wizard
                </NavLink>
                <NavLink to="/reservations/check-in" className="block py-1 text-emerald-400 hover:underline">
                  ✓ Express Check-In
                </NavLink>
                <NavLink to="/reservations/check-out" className="block py-1 text-amber-400 hover:underline">
                  $ Express Check-Out
                </NavLink>
                <NavLink to="/reservations" className="block py-1 text-acc-300 hover:text-brand-400">
                  • Reservation Ledger
                </NavLink>
              </div>
            )}
          </div>

          {/* Services & Billing */}
          <div className="px-3 text-[10px] uppercase font-mono tracking-widest text-acc-500 font-semibold pt-3">
            Billing & Services
          </div>

          <NavLink
            to="/services"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-acc-950 font-extrabold shadow'
                  : 'text-acc-300 hover:bg-acc-850 hover:text-white'
              }`
            }
          >
            <BellRinging size={16} />
            <span>Service Desk</span>
          </NavLink>

          <NavLink
            to="/billing"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-acc-950 font-extrabold shadow'
                  : 'text-acc-300 hover:bg-acc-850 hover:text-white'
              }`
            }
          >
            <Receipt size={16} />
            <span>Billing & Invoices</span>
          </NavLink>

          {/* Administration & Analytics */}
          <div className="px-3 text-[10px] uppercase font-mono tracking-widest text-acc-500 font-semibold pt-3">
            System Admin
          </div>

          {(currentRole === 'Admin' || currentRole === 'Manager') && (
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-acc-950 font-extrabold shadow'
                    : 'text-acc-300 hover:bg-acc-850 hover:text-white'
                }`
              }
            >
              <UserGear size={16} />
              <span>Employees</span>
            </NavLink>
          )}

        </nav>
      </div>
    </aside>
  );
};
