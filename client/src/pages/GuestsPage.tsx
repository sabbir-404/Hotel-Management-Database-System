import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Guest } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  PencilSimple, 
  Trash, 
  MagnifyingGlass, 
  Eye, 
  CalendarPlus, 
  Receipt,
  UserCheck
} from '@phosphor-icons/react';

export const GuestsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSubTab = searchParams.get('tab') || 'list';

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    First_Name: '',
    Last_Name: '',
    Phone_Number: '',
    Email: '',
    Address: '',
    Nationality: 'Bangladeshi',
    Identification_Number: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editForm, setEditForm] = useState({
    First_Name: '',
    Last_Name: '',
    Phone_Number: '',
    Email: '',
    Address: '',
    Nationality: '',
    Identification_Number: ''
  });

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/guests');
      setGuests(res.data);
    } catch (err) {
      console.error('Failed to fetch guests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    try {
      const res = await api.post('/guests', registerForm);
      setRegisterSuccess(`Guest ${res.data.First_Name} ${res.data.Last_Name} registered successfully! (#GST-${res.data.Guest_ID})`);
      setRegisterForm({
        First_Name: '',
        Last_Name: '',
        Phone_Number: '',
        Email: '',
        Address: '',
        Nationality: 'Bangladeshi',
        Identification_Number: ''
      });
      fetchGuests();
    } catch (err: any) {
      setRegisterError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleResetForm = () => {
    setRegisterForm({
      First_Name: '',
      Last_Name: '',
      Phone_Number: '',
      Email: '',
      Address: '',
      Nationality: 'Bangladeshi',
      Identification_Number: ''
    });
    setRegisterError('');
    setRegisterSuccess('');
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setEditForm({
      First_Name: guest.First_Name,
      Last_Name: guest.Last_Name,
      Phone_Number: guest.Phone_Number,
      Email: guest.Email || '',
      Address: guest.Address || '',
      Nationality: guest.Nationality || 'Bangladeshi',
      Identification_Number: guest.Identification_Number
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    try {
      await api.put(`/guests/${editingGuest.Guest_ID}`, editForm);
      setEditModalOpen(false);
      fetchGuests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update guest profile');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete guest profile and linked Person record from database?')) return;
    try {
      await api.delete(`/guests/${id}`);
      fetchGuests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete guest');
    }
  };

  const filteredGuests = guests.filter(g =>
    g.Guest_ID.toString().includes(searchQuery) ||
    `${g.First_Name} ${g.Last_Name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.Phone_Number.includes(searchQuery) ||
    (g.Email && g.Email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    g.Identification_Number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Receptionist';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Guest Management Module
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            Relational MySQL Tables: <code>Person</code> ⟷ <code>Guest</code>
          </p>
        </div>

        <button
          onClick={() => setSearchParams({ tab: 'register' })}
          className="flex items-center gap-2 px-3 py-2 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-semibold text-xs rounded transition-colors font-mono"
        >
          <UserPlus size={16} />
          <span>Register Guest</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-acc-200 dark:border-acc-800 space-x-4">
        <button
          onClick={() => setSearchParams({ tab: 'list' })}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeSubTab === 'list' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500 hover:text-acc-900'
          }`}
        >
          Guest Directory ({guests.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'register' })}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeSubTab === 'register' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500 hover:text-acc-900'
          }`}
        >
          Register Guest Form
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'search' })}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeSubTab === 'search' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500 hover:text-acc-900'
          }`}
        >
          Guest Search & History
        </button>
      </div>

      {/* SUB-TAB 1: Register Guest */}
      {activeSubTab === 'register' && (
        <div className="panel-card p-6 max-w-2xl mx-auto space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Register New Guest Record
          </h3>

          {registerError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs">
              {registerError}
            </div>
          )}

          {registerSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              {registerSuccess}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Full First Name *</label>
                <input
                  type="text"
                  required
                  value={registerForm.First_Name}
                  onChange={(e) => setRegisterForm({ ...registerForm, First_Name: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                  placeholder="e.g. Tanvir"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Full Last Name *</label>
                <input
                  type="text"
                  required
                  value={registerForm.Last_Name}
                  onChange={(e) => setRegisterForm({ ...registerForm, Last_Name: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                  placeholder="e.g. Rahman"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Phone Number (Must be Unique) *</label>
                <input
                  type="text"
                  required
                  value={registerForm.Phone_Number}
                  onChange={(e) => setRegisterForm({ ...registerForm, Phone_Number: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  placeholder="e.g. +8801700112233"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email Address (Must be Unique)</label>
                <input
                  type="email"
                  value={registerForm.Email}
                  onChange={(e) => setRegisterForm({ ...registerForm, Email: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  placeholder="e.g. guest@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">National ID / Passport Number (Unique) *</label>
                <input
                  type="text"
                  required
                  value={registerForm.Identification_Number}
                  onChange={(e) => setRegisterForm({ ...registerForm, Identification_Number: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  placeholder="e.g. NID-1994829102938"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nationality</label>
                <input
                  type="text"
                  value={registerForm.Nationality}
                  onChange={(e) => setRegisterForm({ ...registerForm, Nationality: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Residential Address</label>
              <input
                type="text"
                value={registerForm.Address}
                onChange={(e) => setRegisterForm({ ...registerForm, Address: e.target.value })}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                placeholder="e.g. House 42, Road 11, Banani, Dhaka"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-acc-100 dark:border-acc-800 font-mono">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 border border-acc-300 text-xs rounded hover:bg-acc-100"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded"
              >
                Register Guest
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: Guest List Directory */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          <div className="panel-card p-3 flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest by ID, Name, Phone, Email, or NID/Passport..."
                className="w-full pl-9 pr-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          <div className="panel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
                  <tr>
                    <th className="p-3 font-semibold">Guest ID</th>
                    <th className="p-3 font-semibold">Guest Name</th>
                    <th className="p-3 font-semibold">Phone</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Nationality</th>
                    <th className="p-3 font-semibold">Reg. Date</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
                  {loading ? (
                    <tr><td colSpan={7} className="p-6 text-center text-acc-500">Loading guests...</td></tr>
                  ) : filteredGuests.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-acc-500">No guest profiles found.</td></tr>
                  ) : (
                    filteredGuests.map(g => (
                      <tr key={g.Guest_ID} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                        <td className="p-3 font-bold text-acc-950 dark:text-acc-50">#GST-{g.Guest_ID}</td>
                        <td className="p-3 font-sans font-semibold text-acc-950 dark:text-acc-100">{g.First_Name} {g.Last_Name}</td>
                        <td className="p-3">{g.Phone_Number}</td>
                        <td className="p-3">{g.Email || 'N/A'}</td>
                        <td className="p-3">{g.Nationality}</td>
                        <td className="p-3">{new Date(g.Registration_Date).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/guests/profile/${g.Guest_ID}`)}
                              className="px-2 py-1 bg-acc-900 text-white dark:bg-acc-800 text-[10px] rounded font-mono flex items-center gap-1"
                              title="View Guest Profile"
                            >
                              <Eye size={12} />
                              <span>Profile</span>
                            </button>
                            <button
                              onClick={() => navigate(`/reservations/new?guestId=${g.Guest_ID}`)}
                              className="px-2 py-1 bg-brand-500 text-acc-950 font-bold text-[10px] rounded font-mono flex items-center gap-1"
                              title="Book Room for Guest"
                            >
                              <CalendarPlus size={12} />
                              <span>Book</span>
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(g)}
                                className="p-1 hover:bg-acc-200 rounded"
                                title="Edit"
                              >
                                <PencilSimple size={14} />
                              </button>
                            )}
                            {user?.role === 'Admin' && (
                              <button
                                onClick={() => handleDelete(g.Guest_ID)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Search & History */}
      {activeSubTab === 'search' && (
        <div className="space-y-4">
          <div className="panel-card p-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-acc-500 font-semibold">
              Guest Lookup & Reservation History Search
            </h3>
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Guest ID, Phone (+880...), Name, Email, or National ID / Passport..."
                className="w-full pl-9 pr-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          <div className="panel-card overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-acc-100 dark:bg-acc-800 uppercase text-[10px] border-b border-acc-200">
                <tr>
                  <th className="p-3">Guest ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">NID / Passport</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-acc-100">
                {filteredGuests.map(g => (
                  <tr key={g.Guest_ID} className="hover:bg-acc-50">
                    <td className="p-3 font-bold">#GST-{g.Guest_ID}</td>
                    <td className="p-3 font-sans font-semibold">{g.First_Name} {g.Last_Name}</td>
                    <td className="p-3 font-bold text-brand-600">{g.Identification_Number}</td>
                    <td className="p-3">{g.Phone_Number}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/guests/profile/${g.Guest_ID}`)}
                        className="px-2.5 py-1 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold rounded text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>View History & Bills</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {editModalOpen && editingGuest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 pb-2">
              Edit Guest Details (#GST-{editingGuest.Guest_ID})
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={editForm.First_Name}
                  onChange={(e) => setEditForm({ ...editForm, First_Name: e.target.value })}
                  className="px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs"
                />
                <input
                  type="text"
                  required
                  value={editForm.Last_Name}
                  onChange={(e) => setEditForm({ ...editForm, Last_Name: e.target.value })}
                  className="px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs"
                />
              </div>
              <input
                type="text"
                required
                value={editForm.Phone_Number}
                onChange={(e) => setEditForm({ ...editForm, Phone_Number: e.target.value })}
                className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs font-mono"
              />
              <input
                type="text"
                required
                value={editForm.Identification_Number}
                onChange={(e) => setEditForm({ ...editForm, Identification_Number: e.target.value })}
                className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs font-mono"
              />
              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-acc-950 text-white font-bold text-xs rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
