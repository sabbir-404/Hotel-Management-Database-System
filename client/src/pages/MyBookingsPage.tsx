import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarCheck, 
  Bed, 
  PencilSimple, 
  XCircle, 
  CheckCircle, 
  MagnifyingGlass, 
  CircleNotch, 
  Plus,
  Receipt,
  User,
  SignIn,
  UserPlus
} from '@phosphor-icons/react';

export const MyBookingsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [lookupQuery, setLookupQuery] = useState(searchParams.get('phone') || searchParams.get('guestId') || '');

  // Edit Booking Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    Check_In_Date: '',
    Check_Out_Date: '',
    Number_of_Guests: 1
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const fetchReservations = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [token]);

  const openEditModal = (res: Reservation) => {
    setEditingRes(res);
    setEditForm({
      Check_In_Date: res.Check_In_Date ? res.Check_In_Date.substring(0, 10) : '',
      Check_Out_Date: res.Check_Out_Date ? res.Check_Out_Date.substring(0, 10) : '',
      Number_of_Guests: res.Number_of_Guests || 1
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes) return;
    setIsUpdating(true);
    setMsg('');

    try {
      await api.put(`/reservations/${editingRes.Reservation_ID}`, editForm);
      setMsg(`Booking #${editingRes.Reservation_ID} updated successfully!`);
      setEditModalOpen(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm(`Are you sure you want to cancel Reservation #${id}? This will release the room for other guests.`)) return;
    setIsCancelling(id);
    try {
      await api.put(`/reservations/${id}`, { Reservation_Status: 'Cancelled' });
      setMsg(`Reservation #${id} has been cancelled.`);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setIsCancelling(null);
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (!lookupQuery) return true;
    const q = lookupQuery.toLowerCase();
    return (
      (r.Phone_Number && r.Phone_Number.toLowerCase().includes(q)) ||
      (r.First_Name && r.First_Name.toLowerCase().includes(q)) ||
      (r.Last_Name && r.Last_Name.toLowerCase().includes(q)) ||
      r.Reservation_ID.toString() === q ||
      (r.Guest_ID && r.Guest_ID.toString() === q)
    );
  });

  const getStatusBadge = (status: Reservation['Reservation_Status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Checked In':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300';
      case 'Checked Out':
        return 'bg-acc-100 text-acc-800 border-acc-300 dark:bg-acc-800 dark:text-acc-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  // If user is NOT logged in, show customer authentication prompt
  if (!token) {
    return (
      <div className="py-12 max-w-md mx-auto page-fade-enter text-center">
        <div className="panel-card p-8 space-y-5 border border-acc-200 dark:border-acc-800 shadow-md">
          <div className="w-14 h-14 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <User size={30} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
              Customer Sign-In Required
            </h2>
            <p className="text-xs text-acc-500 font-sans leading-relaxed">
              Please register or sign in to your guest account to view your active hotel bookings, change check-in dates, or cancel reservations.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-acc-950 font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 font-mono"
            >
              <UserPlus size={16} />
              <span>Register Account</span>
            </Link>
            <Link
              to="/login"
              className="flex-1 py-2.5 border border-acc-300 dark:border-acc-700 text-acc-950 dark:text-acc-100 hover:bg-acc-100 dark:hover:bg-acc-800 font-bold text-xs rounded flex items-center justify-center gap-1.5 font-mono"
            >
              <SignIn size={16} />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto page-fade-enter">
      
      {/* Customer Header Banner */}
      <div className="panel-card p-6 border border-acc-200 dark:border-acc-800 bg-gradient-to-r from-acc-950 to-acc-900 text-white rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-pill bg-brand-500 text-acc-950 font-mono text-[9px] font-bold">CUSTOMER PORTAL</span>
            <span className="text-xs font-mono text-acc-400">Logged in as {user?.name || user?.username}</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            My Bookings & Reservations
          </h1>
          <p className="text-xs text-acc-300 font-sans mt-0.5">
            View, modify check-in dates, or cancel active hotel bookings across Bangladesh
          </p>
        </div>

        <Link
          to="/hotels"
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded shadow flex items-center gap-1.5 font-mono active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Book Another Room</span>
        </Link>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Lookup Bar */}
      <div className="panel-card p-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Search by Reservation ID, Guest Name, or Phone Number..."
            className="w-full pl-9 pr-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs focus:outline-none font-mono"
          />
        </div>
        {lookupQuery && (
          <button
            onClick={() => setLookupQuery('')}
            className="text-xs text-brand-500 underline font-mono"
          >
            Clear Lookup Filter
          </button>
        )}
      </div>

      {/* Bookings List Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-acc-500 flex items-center justify-center gap-2">
          <CircleNotch size={18} className="animate-spin text-brand-500" />
          <span>Loading customer reservations...</span>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="panel-card p-10 text-center space-y-3">
          <CalendarCheck size={40} className="mx-auto text-acc-400" />
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50">No Bookings Found</h3>
          <p className="text-xs text-acc-500 max-w-sm mx-auto font-sans">
            You don't have any matching hotel reservations yet. Browse our luxury hotels across Bangladesh to book your stay.
          </p>
          <div className="pt-2">
            <Link
              to="/hotels"
              className="px-4 py-2 bg-brand-500 text-acc-950 font-bold text-xs rounded shadow"
            >
              Browse Hotels Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((r) => {
            const checkIn = new Date(r.Check_In_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const checkOut = new Date(r.Check_Out_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const isCanCancel = r.Reservation_Status === 'Confirmed' || r.Reservation_Status === 'Pending';
            const isCanEdit = r.Reservation_Status === 'Confirmed' || r.Reservation_Status === 'Pending';
            const nightly = Number(r.Nightly_Rate || 3500);
            const nights = r.Total_Nights || 2;
            const totalEst = nightly * nights;

            return (
              <div
                key={r.Reservation_ID}
                className="panel-card p-5 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all shadow-sm space-y-4"
              >
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-acc-100 dark:border-acc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-acc-950 dark:text-acc-50">
                      Booking #{r.Reservation_ID}
                    </span>
                    <span className={`badge-pill border font-mono text-[10px] ${getStatusBadge(r.Reservation_Status)}`}>
                      {r.Reservation_Status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-acc-500">
                    Booked for: <strong className="text-acc-900 dark:text-acc-200">{r.First_Name} {r.Last_Name}</strong> ({r.Phone_Number || 'N/A'})
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  
                  {/* Hotel & Room Info */}
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-brand-600 dark:text-brand-400 font-sans">
                      {r.Hotel_Name || 'Hotel.com Grand Branch'}
                    </div>
                    <div className="flex items-center gap-1 text-acc-600 dark:text-acc-400">
                      <Bed size={15} className="text-brand-500" />
                      <span>Room {r.Room_Number} ({r.Room_Type || 'Deluxe'})</span>
                    </div>
                    <div className="text-acc-500 text-[11px]">
                      Guests: {r.Number_of_Guests || 1} Person(s)
                    </div>
                  </div>

                  {/* Stay Dates */}
                  <div className="space-y-1 bg-acc-50 dark:bg-acc-850 p-2.5 rounded border border-acc-200 dark:border-acc-800">
                    <div className="text-acc-500 text-[10px] uppercase font-bold">Stay Schedule</div>
                    <div className="font-semibold text-acc-900 dark:text-acc-100">
                      {checkIn} ➔ {checkOut}
                    </div>
                    <div className="text-acc-500 text-[11px]">
                      Duration: {nights} Night(s)
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1 text-right">
                    <div className="text-acc-500 text-[10px] uppercase font-bold">Total Estimated Rate</div>
                    <div className="text-base font-extrabold text-acc-950 dark:text-acc-50">
                      BDT {totalEst.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-acc-500">
                      BDT {nightly.toLocaleString()} / night
                    </div>
                  </div>

                </div>

                {/* Bottom Action Controls */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-acc-100 dark:border-acc-800 gap-2">
                  <div className="text-[11px] font-mono text-acc-500">
                    {r.Payment_Status ? `Payment Status: ${r.Payment_Status}` : 'Pay at Property on Check-In'}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCanEdit && (
                      <button
                        onClick={() => openEditModal(r)}
                        className="px-3 py-1.5 border border-acc-300 dark:border-acc-700 text-acc-950 dark:text-acc-100 hover:bg-acc-100 dark:hover:bg-acc-800 rounded font-mono text-xs flex items-center gap-1 transition-colors"
                      >
                        <PencilSimple size={14} />
                        <span>Update Dates</span>
                      </button>
                    )}

                    {isCanCancel && (
                      <button
                        onClick={() => handleCancel(r.Reservation_ID)}
                        disabled={isCancelling === r.Reservation_ID}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded font-mono text-xs flex items-center gap-1 transition-colors"
                      >
                        {isCancelling === r.Reservation_ID ? (
                          <CircleNotch size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        <span>Cancel Booking</span>
                      </button>
                    )}

                    <Link
                      to={`/billing`}
                      className="px-3 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded flex items-center gap-1 font-mono"
                    >
                      <Receipt size={14} />
                      <span>View Invoice</span>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Booking Dates Modal */}
      {editModalOpen && editingRes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 pb-2">
              Update Booking #{editingRes.Reservation_ID}
            </h3>

            <form onSubmit={handleUpdate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-medium mb-1">Check-In Date *</label>
                <input
                  type="date"
                  required
                  value={editForm.Check_In_Date}
                  onChange={(e) => setEditForm({ ...editForm, Check_In_Date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Check-Out Date *</label>
                <input
                  type="date"
                  required
                  value={editForm.Check_Out_Date}
                  onChange={(e) => setEditForm({ ...editForm, Check_Out_Date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editForm.Number_of_Guests}
                  onChange={(e) => setEditForm({ ...editForm, Number_of_Guests: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border border-acc-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 bg-brand-500 text-acc-950 font-bold text-xs rounded flex items-center gap-1"
                >
                  {isUpdating ? <CircleNotch size={14} className="animate-spin" /> : null}
                  <span>Save Booking Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
