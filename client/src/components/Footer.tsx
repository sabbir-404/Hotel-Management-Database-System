import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Envelope, ShieldCheck } from '@phosphor-icons/react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-acc-950 text-acc-300 border-t border-acc-800 pt-10 pb-6 text-xs font-sans">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
        {/* Column 1: Brand & Bio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-brand-500 text-acc-950 flex items-center justify-center font-extrabold font-mono text-xs">
              H.c
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">Hotel.com</span>
          </div>
          <p className="text-acc-400 text-xs leading-relaxed font-sans">
            Bangladesh's premium hospitality network.
          </p>
        </div>

        {/* Column 2: Quick Navigation */}
        <div className="space-y-3 font-mono">
          <h4 className="text-white font-bold uppercase text-[11px] tracking-wider border-b border-acc-800 pb-1">
            Quick Links
          </h4>
          <ul className="space-y-2 text-acc-400 text-[11px]">
            <li>
              <Link to="/" className="hover:text-brand-400 transition-colors">Home Page</Link>
            </li>
            <li>
              <Link to="/hotels" className="hover:text-brand-400 transition-colors">Browse All Hotels</Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-brand-400 transition-colors">Guest Self-Registration</Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-brand-400 transition-colors">Staff Portal Login</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact & Support */}
        <div className="space-y-3 font-mono">
          <h4 className="text-white font-bold uppercase text-[11px] tracking-wider border-b border-acc-800 pb-1">
            Contact Support
          </h4>
          <ul className="space-y-2 text-acc-400 text-[11px]">
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-brand-400 shrink-0" />
              <span>Independent University, Bangladesh Plot 16, Block B, Aftabuddin Ahmed Road Bashundhara Residential Area, Dhaka 1245 Bangladesh</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-brand-400 shrink-0" />
              <span>+880-1234-56789</span>
            </li>
            <li className="flex items-center gap-2">
              <Envelope size={14} className="text-brand-400 shrink-0" />
              <span>support@hotel.com.bd</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Sub-Footer Copyright Bar */}
      <div className="max-w-6xl mx-auto px-6 pt-4 border-t border-acc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-acc-500">
        <p>© 2026 Hotel.com Bangladesh. All rights reserved.</p>
      </div>
    </footer>
  );
};
