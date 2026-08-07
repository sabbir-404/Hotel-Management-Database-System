import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  ArrowRight, 
  CircleNotch,
  Phone,
  IdentificationCard
} from '@phosphor-icons/react';

export const GuestLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { guestLogin } = useAuth();

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fillSampleGuest = () => {
    setPhoneOrEmail('+8801700112233');
    setIdentificationNumber('NID-1994829102938');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await guestLogin(phoneOrEmail, identificationNumber);
      navigate('/my-bookings');
    } catch (err: any) {
      setErrorMsg(err.message || 'Customer login failed. Please check credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 max-w-md mx-auto page-fade-enter">
      <div className="panel-card p-6 md:p-8 space-y-6 shadow-md border border-acc-200 dark:border-acc-800">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-acc-100 dark:border-acc-800 pb-4">
          <div className="w-12 h-12 rounded bg-brand-500 text-acc-950 flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <UserCheck size={26} />
          </div>
          <span className="badge-pill bg-brand-500 text-acc-950 font-mono text-[9px] font-bold">CUSTOMER LOGIN</span>
          <h1 className="text-xl font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
            Guest Account Sign In
          </h1>
          <p className="text-xs text-acc-500 font-sans">
            Sign in to view your bookings, change stay dates, or request cancellations
          </p>
        </div>

        {/* Quick Sample Demo Badge */}
        <div className="p-3 bg-acc-50 dark:bg-acc-850 border border-acc-200 dark:border-acc-700 rounded text-[11px] font-mono text-acc-700 dark:text-acc-300 space-y-1">
          <div className="font-bold text-acc-950 dark:text-acc-100 flex items-center justify-between">
            <span>Demo Registered Guest Account:</span>
            <button
              type="button"
              onClick={fillSampleGuest}
              className="text-brand-600 dark:text-brand-400 underline font-bold hover:text-brand-500"
            >
              Fill Sample Credentials
            </button>
          </div>
          <p className="text-[10px] text-acc-500">
            Phone: <code>+8801700112233</code> | NID: <code>NID-1994829102938</code>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1">
              <Phone size={14} className="text-brand-500" />
              <span>Registered Phone Number or Email *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +8801700112233 or tanvir@example.com"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1">
              <IdentificationCard size={14} className="text-brand-500" />
              <span>National ID / Passport Number *</span>
            </label>
            <input
              type="password"
              required
              placeholder="e.g. NID-1994829102938"
              value={identificationNumber}
              onChange={(e) => setIdentificationNumber(e.target.value)}
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded transition-all flex items-center justify-center gap-2 shadow active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Authenticating Guest Account...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Customer Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

        </form>

        <div className="pt-4 border-t border-acc-100 dark:border-acc-800 flex justify-between items-center text-xs font-mono">
          <span className="text-acc-500">Don't have a guest account?</span>
          <Link to="/register" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
            Sign Up / Register →
          </Link>
        </div>

      </div>
    </div>
  );
};
