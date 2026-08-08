import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  ArrowRight, 
  CheckCircle, 
  CircleNotch,
  User,
  XCircle,
  LockKey
} from '@phosphor-icons/react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { guestLogin } = useAuth();

  const [form, setForm] = useState({
    First_Name: '',
    Last_Name: '',
    Username: '',
    Password: '',
    Confirm_Password: '',
    Phone_Number: '',
    Email: '',
    Address: '',
    Nationality: 'Bangladeshi',
    Identification_Number: ''
  });

  // Real-time username check state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameMsg, setUsernameMsg] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live Automatic Username Availability Check
  useEffect(() => {
    const trimmedUsername = form.Username.trim();

    if (!trimmedUsername) {
      setUsernameStatus('idle');
      setUsernameMsg('');
      return;
    }

    if (trimmedUsername.length < 3) {
      setUsernameStatus('taken');
      setUsernameMsg('Username must be at least 3 characters');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMsg('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/guests/check-username?username=${encodeURIComponent(trimmedUsername)}`);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameMsg('✓ Username is available');
        } else {
          setUsernameStatus('taken');
          setUsernameMsg(res.data.message || '✗ Username is already taken');
        }
      } catch (err) {
        setUsernameStatus('idle');
        setUsernameMsg('');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.Username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (form.Username && usernameStatus === 'taken') {
      setErrorMsg('Please choose an available username before submitting.');
      return;
    }

    if (!form.Password || form.Password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (form.Password !== form.Confirm_Password) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Guest & Person in DB with Password
      const payload = {
        First_Name: form.First_Name,
        Last_Name: form.Last_Name,
        Username: form.Username,
        Password: form.Password,
        Phone_Number: form.Phone_Number,
        Email: form.Email,
        Address: form.Address,
        Nationality: form.Nationality,
        Identification_Number: form.Identification_Number
      };

      const res = await api.post('/guests', payload);
      const newGuest = res.data;

      setSuccessMsg(`Registration successful! Guest Profile #${newGuest.Guest_ID} created. Logging you in...`);

      // 2. Automatically log in as Guest using guest login API
      try {
        await guestLogin(form.Username || form.Email || form.Phone_Number, form.Password);
      } catch (loginErr) {
        console.warn('Auto guest-login fallback:', loginErr);
      }

      // 3. Soft delay and redirect to Guest Dashboard
      setTimeout(() => {
        const bookHotelId = new URLSearchParams(window.location.search).get('hotelId');
        if (bookHotelId) {
          navigate(`/guest-dashboard?bookHotelId=${bookHotelId}`);
        } else {
          navigate('/guest-dashboard');
        }
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration failed. Please check inputs.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 max-w-xl mx-auto page-fade-enter">
      <div className="panel-card p-6 md:p-8 space-y-6 shadow-md border border-acc-200 dark:border-acc-800">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-acc-100 dark:border-acc-800 pb-4">
          <div className="w-12 h-12 rounded bg-brand-500 text-acc-950 flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <UserPlus size={24} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
            Guest Account Registration
          </h1>
          <p className="text-xs text-acc-500 font-sans">
            Register your unique guest username & profile to book luxury hotels on <strong>Hotel.com</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sadman"
                value={form.First_Name}
                onChange={(e) => setForm({ ...form, First_Name: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Last Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Showmik"
                value={form.Last_Name}
                onChange={(e) => setForm({ ...form, Last_Name: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
              />
            </div>
          </div>

          {/* Unique Username Input Field with Real-Time Auto Check */}
          <div>
            <label className="block font-medium mb-1 flex items-center gap-1">
              <User size={14} className="text-brand-500" />
              <span>Unique Username *</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. sadman_bd"
                value={form.Username}
                onChange={(e) => setForm({ ...form, Username: e.target.value })}
                className={`w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border rounded text-xs font-mono transition-colors ${
                  usernameStatus === 'available'
                    ? 'border-emerald-500 focus:border-emerald-500'
                    : usernameStatus === 'taken'
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-acc-300 dark:border-acc-700'
                }`}
              />
              {usernameStatus === 'checking' && (
                <CircleNotch size={16} className="animate-spin text-amber-500 absolute right-3 top-2.5" />
              )}
              {usernameStatus === 'available' && (
                <CheckCircle size={16} className="text-emerald-500 absolute right-3 top-2.5" />
              )}
              {usernameStatus === 'taken' && (
                <XCircle size={16} className="text-red-500 absolute right-3 top-2.5" />
              )}
            </div>

            {/* Live Feedback Message */}
            {usernameMsg && (
              <p className={`text-[11px] font-mono mt-1 ${
                usernameStatus === 'available' 
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                  : usernameStatus === 'taken' 
                  ? 'text-red-600 dark:text-red-400 font-bold' 
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {usernameMsg}
              </p>
            )}
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 flex items-center gap-1">
                <LockKey size={14} className="text-brand-500" />
                <span>Password *</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.Password}
                onChange={(e) => setForm({ ...form, Password: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 flex items-center gap-1">
                <LockKey size={14} className="text-brand-500" />
                <span>Confirm Password *</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.Confirm_Password}
                onChange={(e) => setForm({ ...form, Confirm_Password: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Phone Number (Unique) *</label>
              <input
                type="text"
                required
                placeholder="+88017..."
                value={form.Phone_Number}
                onChange={(e) => setForm({ ...form, Phone_Number: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">National ID / Passport (Unique) *</label>
              <input
                type="text"
                required
                placeholder="NID-199..."
                value={form.Identification_Number}
                onChange={(e) => setForm({ ...form, Identification_Number: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Email Address</label>
              <input
                type="email"
                placeholder="guest@example.com"
                value={form.Email}
                onChange={(e) => setForm({ ...form, Email: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Nationality</label>
              <input
                type="text"
                value={form.Nationality}
                onChange={(e) => setForm({ ...form, Nationality: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Address</label>
            <input
              type="text"
              placeholder="e.g. Banani, Dhaka"
              value={form.Address}
              onChange={(e) => setForm({ ...form, Address: e.target.value })}
              className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-acc-950 font-extrabold text-xs rounded transition-all flex items-center justify-center gap-2 shadow active:scale-95 font-mono"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Registering Account & Loading Booking...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration & Book Room</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

        </form>

        <div className="pt-4 border-t border-acc-100 dark:border-acc-800 flex justify-between items-center text-xs font-mono">
          <span className="text-acc-500">Already have a guest account?</span>
          <Link to="/guest-login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
            Guest Account Sign In →
          </Link>
        </div>

      </div>
    </div>
  );
};
