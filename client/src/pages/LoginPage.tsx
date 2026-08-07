import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ArrowRight, LockKey, UserCheck } from '@phosphor-icons/react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, selectedRole);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (presetUsername: string, role: UserRole) => {
    setUsername(presetUsername);
    setPassword('password');
    setSelectedRole(role);
  };

  return (
    <div className="py-12 flex flex-col items-center justify-center page-fade-enter">
      <div className="w-full max-w-md bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-800 rounded-lg p-8 shadow-sm space-y-5">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-mono font-extrabold text-lg rounded flex items-center justify-center mx-auto mb-2 shadow">
            HMS
          </div>
          <span className="badge-pill bg-acc-900 text-white font-mono text-[9px] font-bold">STAFF PORTAL LOGIN</span>
          <h2 className="text-xl font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
            Staff Portal Sign In
          </h2>
          <p className="text-xs font-sans text-acc-500 dark:text-acc-400">
            For Hotel Administrators, Branch Managers, and Receptionist Staff
          </p>
        </div>

        {/* Demo Quick Presets */}
        <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-700">
          <p className="text-[10px] uppercase font-mono tracking-wider text-acc-500 mb-2 font-semibold">
            Quick Staff Preset Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin', 'Admin')}
              className={`px-2 py-1.5 rounded text-xs font-mono border transition-all ${
                selectedRole === 'Admin' 
                  ? 'bg-acc-900 text-white border-acc-900 dark:bg-brand-500 dark:text-acc-950 dark:border-brand-500 font-semibold' 
                  : 'bg-white text-acc-800 border-acc-200 dark:bg-acc-900 dark:text-acc-200 dark:border-acc-700 hover:bg-acc-100'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setPreset('receptionist', 'Receptionist')}
              className={`px-2 py-1.5 rounded text-xs font-mono border transition-all ${
                selectedRole === 'Receptionist' 
                  ? 'bg-acc-900 text-white border-acc-900 dark:bg-brand-500 dark:text-acc-950 dark:border-brand-500 font-semibold' 
                  : 'bg-white text-acc-800 border-acc-200 dark:bg-acc-900 dark:text-acc-200 dark:border-acc-700 hover:bg-acc-100'
              }`}
            >
              Receptionist
            </button>
            <button
              type="button"
              onClick={() => setPreset('manager', 'Manager')}
              className={`px-2 py-1.5 rounded text-xs font-mono border transition-all ${
                selectedRole === 'Manager' 
                  ? 'bg-acc-900 text-white border-acc-900 dark:bg-brand-500 dark:text-acc-950 dark:border-brand-500 font-semibold' 
                  : 'bg-white text-acc-800 border-acc-200 dark:bg-acc-900 dark:text-acc-200 dark:border-acc-700 hover:bg-acc-100'
              }`}
            >
              Manager
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block font-medium text-acc-700 dark:text-acc-300 mb-1">
              Staff Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-acc-950 dark:text-acc-50 focus:outline-none focus:border-acc-900 font-mono"
              placeholder="admin, receptionist, manager"
            />
          </div>

          <div>
            <label className="block font-medium text-acc-700 dark:text-acc-300 mb-1">
              Staff Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-acc-950 dark:text-acc-50 focus:outline-none focus:border-acc-900 font-mono"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block font-medium text-acc-700 dark:text-acc-300 mb-1">
              System Access Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-acc-950 dark:text-acc-50 focus:outline-none focus:border-acc-900 font-mono"
            >
              <option value="Admin">Admin (Full Control)</option>
              <option value="Receptionist">Receptionist (Bookings & Check-in)</option>
              <option value="Manager">Manager (Reports & Audits)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-bold text-xs rounded transition-all flex items-center justify-center gap-2 font-mono shadow active:scale-95"
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
