import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Reservation } from '../types';
import { CurrencyCircleDollar, MagnifyingGlass, Receipt, CheckCircle } from '@phosphor-icons/react';

export const CheckOutPage: React.FC = () => {
  const [checkedInReservations, setCheckedInReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Banking' | 'Bank Transfer'>('Card');
  const [submitting, setSubmitting] = useState(false);

  const fetchCheckedInGuests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations?status=Checked In');
      setCheckedInReservations(res.data);
    } catch (err) {
      console.error('Failed to load checked-in guests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckedInGuests();
  }, []);

  const handleProcessCheckOut = async (resId: number) => {
    setSubmitting(true);
    try {
      // 1. Generate final bill
      await api.post('/bills/generate', {
        Reservation_ID: resId,
        Payment_Method: paymentMethod
      });

      setSelectedRes(null);
      fetchCheckedInGuests();
      alert('Check-out completed! Final BDT bill generated, reservation marked Checked Out, and room reset to Available.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Check-out settlement failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = checkedInReservations.filter(r =>
    r.Reservation_ID.toString().includes(search) ||
    `${r.First_Name || ''} ${r.Last_Name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    (r.Room_Number && r.Room_Number.includes(search))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50 flex items-center gap-2">
          <CurrencyCircleDollar className="text-amber-500" size={24} />
          <span>Express Guest Check-Out & Billing Settlement</span>
        </h1>
        <p className="text-xs text-acc-500 font-mono">
          Menu: Reservation ➔ Check-Out | Calculates Room Charge + Services + Taxes ➔ Final Bill ➔ Room Available
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
            placeholder="Search checked-in guests by Reservation ID (#RES-...) or Name..."
            className="w-full pl-9 pr-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checked In In-House Guests List */}
        <div className="panel-card p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-acc-500 font-semibold">
            In-House Guests Pending Check-Out
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs font-mono text-acc-500">Loading in-house guests...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-acc-500">No in-house guests currently checked in.</div>
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
                    <p className="text-[10px] opacity-70">Checked In: {new Date(r.Check_In_Date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-mono font-bold">#RES-{r.Reservation_ID}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Check-Out Billing Summary & Action */}
        <div className="panel-card p-6 flex flex-col justify-between">
          {selectedRes ? (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold font-sans text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
                Automated Settlement & Bill Calculation
              </h3>

              <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 space-y-1">
                <p className="text-[10px] uppercase text-acc-500 font-semibold font-sans">Guest & Room</p>
                <p className="font-bold text-sm font-sans text-acc-950 dark:text-acc-50">{selectedRes.First_Name} {selectedRes.Last_Name}</p>
                <p>Room {selectedRes.Room_Number} ({selectedRes.Hotel_Name})</p>
                <p>Duration: {selectedRes.Total_Nights || 1} Night(s)</p>
              </div>

              <div>
                <label className="block text-xs font-medium font-sans mb-1">Select Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                >
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Banking">Mobile Banking (bKash / Nagad)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 space-y-1">
                <p className="text-[10px] uppercase text-acc-500 font-semibold font-sans">Charge Breakdown (BDT ৳)</p>
                <div className="flex justify-between">
                  <span>Room Cost ({selectedRes.Total_Nights || 1} nights):</span>
                  <span>৳{Number(selectedRes.Room_Charge || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-acc-500">
                  <span>Services + Taxes (10%):</span>
                  <span>Auto calculated</span>
                </div>
              </div>

              <button
                disabled={submitting}
                onClick={() => handleProcessCheckOut(selectedRes.Reservation_ID)}
                className="w-full py-3 bg-brand-500 text-acc-950 font-extrabold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow"
              >
                <Receipt size={18} />
                <span>{submitting ? 'Generating Bill...' : 'Generate Bill & Check-Out'}</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-xs font-mono text-acc-500">
              Select an in-house guest from the left panel to settle bill & check-out.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
