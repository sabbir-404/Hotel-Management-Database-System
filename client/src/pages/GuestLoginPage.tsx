import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  ArrowRight, 
  CircleNotch,
  Envelope,
  LockKey
} from '@phosphor-icons/react';

export const GuestLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { guestLogin } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await guestLogin(emailOrUsername, password);
      navigate('/guest-dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Customer login failed. Please check your Email ID / Username and Password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 max-w-md mx-auto page-fade-enter">
      <div className="panel-card p-6 md:p-8 space-y-6 shadow-md border border-acc-200 dark:border-acc-800">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-acc-100 dark:border-acc-800 pb-4">
          <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-full text-brand-600 dark:text-brand-400 mb-1">
            <UserCheck size={28} weight="bold" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
            Guest Account Sign In
          </h1>
          <p className="text-xs text-acc-500 font-sans">
            Sign in using your Email ID or Username and Password to view your hotel bookings
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
              <Envelope size={14} className="text-brand-500" />
              <span>Email ID or Username *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. tanvir.rahman@example.com or Tanvir"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1">
              <LockKey size={14} className="text-brand-500" />
              <span>Password *</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded transition-all flex items-center justify-center gap-2 shadow active:scale-95 font-mono"
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
