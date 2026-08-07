import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  ArrowRight, 
  CheckCircle, 
  CircleNotch
} from '@phosphor-icons/react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    First_Name: '',
    Last_Name: '',
    Phone_Number: '',
    Email: '',
    Address: '',
    Nationality: 'Bangladeshi',
    Identification_Number: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      // 1. Create Guest & Person in DB
      const res = await api.post('/guests', form);
      const newGuest = res.data;

      setSuccessMsg(`Registration successful! Profile #GST-${newGuest.Guest_ID} created. Logging you in...`);

      // 2. Automatically log in as Guest / Receptionist context to allow self-booking
      try {
        await login('receptionist', 'Receptionist');
      } catch (loginErr) {
        console.warn('Auto-login fallback:', loginErr);
      }

      // 3. Soft delay and redirect to booking wizard with guest preselected
      setTimeout(() => {
        navigate(`/reservations/new?guestId=${newGuest.Guest_ID}`);
      }, 1200);

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
            Register your profile once to book luxury hotels across Bangladesh on <strong>Hotel.com</strong>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">First Name *</label>
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
              <label className="block text-xs font-medium mb-1">Last Name *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Phone Number (Unique) *</label>
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
              <label className="block text-xs font-medium mb-1">National ID / Passport (Unique) *</label>
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
              <label className="block text-xs font-medium mb-1">Email Address</label>
              <input
                type="email"
                placeholder="guest@example.com"
                value={form.Email}
                onChange={(e) => setForm({ ...form, Email: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nationality</label>
              <input
                type="text"
                value={form.Nationality}
                onChange={(e) => setForm({ ...form, Nationality: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Address</label>
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
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded transition-all flex items-center justify-center gap-2 shadow"
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
