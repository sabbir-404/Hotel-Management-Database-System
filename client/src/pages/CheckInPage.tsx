import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Reservation } from '../types';
import { CheckCircle, MagnifyingGlass, Bed, Calendar, User } from '@phosphor-icons/react';

export const CheckInPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchConfirmedReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations?status=Confirmed');
      setReservations(res.data);
    } catch (err) {
      console.error('Failed to load arrivals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedReservations();
  }, []);

  const handleCheckIn = async (resId: number) => {
    setSubmitting(true);
    try {
      await api.put(`/reservations/${resId}`, { Reservation_Status: 'Checked In' });
      setSelectedRes(null);
      fetchConfirmedReservations();
      alert('Guest checked in successfully! Room status updated to Occupied.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reservations.filter(r =>
    r.Reservation_ID.toString().includes(search) ||
    `${r.First_Name || ''} ${r.Last_Name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    (r.Room_Number && r.Room_Number.includes(search))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50 flex items-center gap-2">
          <CheckCircle className="text-emerald-500" size={24} />
          <span>Express Guest Check-In Workflow</span>
        </h1>
        <p className="text-xs text-acc-500 font-mono">
          Menu: Reservation ➔ Check-In | Updates Reservation ➔ Checked In & Room ➔ Occupied
        </p>
      </div>

      {/* Search Bar */}
      <div className="panel-card p-3">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Reservation ID (#RES-...) or Guest Name..."
            className="w-full pl-9 pr-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Arrivals List */}
        <div className="panel-card p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-acc-500 font-semibold">
            Confirmed Arrivals Pending Check-In
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs font-mono text-acc-500">Loading arrivals...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-acc-500">No confirmed arrivals pending check-in.</div>
            ) : (
              filtered.map(r => (
                <div
                  key={r.Reservation_ID}
                  onClick={() => setSelectedRes(r)}
                  className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-all ${
                    selectedRes?.Reservation_ID === r.Reservation_ID
                      ? 'bg-acc-950 text-white dark:bg-acc-800 border-acc-950'
                      : 'bg-white dark:bg-acc-900 border-acc-200 dark:border-acc-800 hover:bg-acc-50'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs">{r.First_Name} {r.Last_Name}</h4>
                    <p className="text-[11px] font-mono opacity-80">Room {r.Room_Number} | {r.Hotel_Name}</p>
                    <p className="text-[10px] opacity-70">Check-in: {new Date(r.Check_In_Date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-mono font-bold">#RES-{r.Reservation_ID}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Arrival Summary & Check-In Action Card */}
        <div className="panel-card p-6 flex flex-col justify-between">
          {selectedRes ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
                Check-In Confirmation Details
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 space-y-1">
                  <p className="text-[10px] uppercase text-acc-500 font-semibold">Guest Profile</p>
                  <p className="font-bold text-sm text-acc-950 dark:text-acc-50">{selectedRes.First_Name} {selectedRes.Last_Name}</p>
                  <p>Phone: {selectedRes.Phone_Number}</p>
                  <p>Email: {selectedRes.Email || 'N/A'}</p>
                </div>

                <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 space-y-1">
                  <p className="text-[10px] uppercase text-acc-500 font-semibold">Accommodation</p>
                  <p className="font-bold text-acc-950 dark:text-acc-50">{selectedRes.Hotel_Name}</p>
                  <p>Room {selectedRes.Room_Number} ({selectedRes.Room_Type})</p>
                  <p>Nightly Rate: ৳{Number(selectedRes.Nightly_Rate || 0).toLocaleString()}</p>
                </div>

                <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 space-y-1">
                  <p className="text-[10px] uppercase text-acc-500 font-semibold">Schedule</p>
                  <p>Check-In: {new Date(selectedRes.Check_In_Date).toLocaleDateString()}</p>
                  <p>Check-Out: {new Date(selectedRes.Check_Out_Date).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                disabled={submitting}
                onClick={() => handleCheckIn(selectedRes.Reservation_ID)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                <span>{submitting ? 'Processing Check-In...' : 'Confirm Guest Check-In'}</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-xs font-mono text-acc-500">
              Select a reservation from the list to view check-in details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
