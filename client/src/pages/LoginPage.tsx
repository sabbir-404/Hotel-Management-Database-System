import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LockKey, UserCheck } from '@phosphor-icons/react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid staff credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 flex flex-col items-center justify-center page-fade-enter">
      <div className="w-full max-w-md bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-800 rounded-2xl p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-mono font-extrabold text-lg rounded-xl flex items-center justify-center mx-auto mb-2 shadow">
            HMS
          </div>
          <span className="badge-pill bg-acc-900 text-white font-mono text-[9px] font-bold">STAFF PORTAL LOGIN</span>
          <h2 className="text-xl font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
            Staff Portal Sign In
          </h2>
          <p className="text-xs font-sans text-acc-500 dark:text-acc-400">
            System Admin & Hotel Employee Account Login
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block font-medium text-acc-700 dark:text-acc-300 mb-1">
              Staff Username / Email *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl text-acc-950 dark:text-acc-50 focus:outline-none focus:border-acc-900 font-mono"
              placeholder="e.g. admin"
            />
          </div>

          <div>
            <label className="block font-medium text-acc-700 dark:text-acc-300 mb-1">
              Staff Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl text-acc-950 dark:text-acc-50 focus:outline-none focus:border-acc-900 font-mono"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 font-mono shadow active:scale-95"
          >
            <span>{isSubmitting ? 'Authenticating Staff...' : 'Sign In to Staff Panel'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-4 border-t border-acc-100 dark:border-acc-800 flex justify-between items-center text-xs font-mono">
          <span className="text-acc-500">Are you a Hotel Guest?</span>
          <Link to="/guest-login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1">
            <UserCheck size={14} />
            <span>Customer Guest Login →</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
