import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  User, 
  Bed, 
  CalendarCheck, 
  BellRinging, 
  Receipt, 
  CurrencyCircleDollar,
  ArrowLeft,
  Printer,
  Eye,
  IdentificationCard
} from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';

export const GuestProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'reservations' | 'services' | 'bills'>('personal');

  const fetchGuestProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/guests/profile/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to fetch guest profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchGuestProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-acc-500">
        Loading guest profile details & MySQL history...
      </div>
    );
  }

  if (!profileData || !profileData.guest) {
    return (
      <div className="p-8 text-center text-xs font-mono text-red-500 space-y-3">
        <p>Guest profile record not found.</p>
        <Link to="/guests" className="text-acc-900 underline">Back to Guest Directory</Link>
      </div>
    );
  }

  const { guest, summary, reservations, services, bills } = profileData;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar with Back Link */}
      <div className="flex items-center justify-between border-b border-acc-200 dark:border-acc-800 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/guests" className="p-2 border border-acc-300 rounded hover:bg-acc-100 text-acc-700">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
              {guest.First_Name} {guest.Last_Name}
            </h1>
            <p className="text-xs text-acc-500 font-mono">
              Guest ID: #GST-{guest.Guest_ID} | NID/Passport: {guest.Identification_Number}
            </p>
          </div>
        </div>

        <Link
          to={`/reservations/new?guestId=${guest.Guest_ID}`}
          className="px-3 py-1.5 bg-brand-500 text-acc-950 font-bold text-xs rounded hover:bg-brand-600 font-mono"
        >
          Book Room for Guest
        </Link>
      </div>

      {/* Guest Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="panel-card p-3">
          <p className="text-[10px] font-mono uppercase text-acc-500">Active Res.</p>
          <p className="font-bold text-xs font-mono text-acc-950 dark:text-acc-50 mt-1">{summary.activeReservation}</p>
        </div>
        <div className="panel-card p-3">
          <p className="text-[10px] font-mono uppercase text-acc-500">Previous Stays</p>
          <p className="font-bold text-xs font-mono text-acc-950 dark:text-acc-50 mt-1">{summary.previousReservations}</p>
        </div>
        <div className="panel-card p-3">
          <p className="text-[10px] font-mono uppercase text-acc-500">Current Room</p>
          <p className="font-bold text-xs font-mono text-acc-950 dark:text-acc-50 mt-1 truncate">{summary.currentRoom}</p>
        </div>
        <div className="panel-card p-3">
          <p className="text-[10px] font-mono uppercase text-acc-500">Services Used</p>
          <p className="font-bold text-xs font-mono text-acc-950 dark:text-acc-50 mt-1">{summary.totalServicesUsed} Items</p>
        </div>
        <div className="panel-card p-3 border-l-2 border-l-red-500">
          <p className="text-[10px] font-mono uppercase text-acc-500">Outstanding</p>
          <p className="font-bold text-xs font-mono text-red-600 dark:text-red-400 mt-1">
            ৳{Number(summary.outstandingBill).toLocaleString()}
          </p>
        </div>
        <div className="panel-card p-3 border-l-2 border-l-brand-500">
          <p className="text-[10px] font-mono uppercase text-acc-500">Total Spent</p>
          <p className="font-bold text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{Number(summary.totalAmountSpent).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-acc-200 dark:border-acc-800 space-x-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'personal' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500'
          }`}
        >
          Personal Details
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'reservations' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500'
          }`}
        >
          Reservation History ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'services' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500'
          }`}
        >
          Service History ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'bills' ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50' : 'border-transparent text-acc-500'
          }`}
        >
          Billing & Invoices ({bills.length})
        </button>
      </div>

      {/* Tab Content 1: Personal Details */}
      {activeTab === 'personal' && (
        <div className="panel-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Personal Profile Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">Full Name</span>
              <span className="font-bold text-sm text-acc-950 dark:text-acc-50">{guest.First_Name} {guest.Last_Name}</span>
            </div>
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">National ID / Passport Number</span>
              <span className="font-bold text-sm text-acc-950 dark:text-acc-50">{guest.Identification_Number}</span>
            </div>
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">Phone Number</span>
              <span>{guest.Phone_Number}</span>
            </div>
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">Email Address</span>
              <span>{guest.Email || 'No Email Registered'}</span>
            </div>
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">Nationality</span>
              <span>{guest.Nationality}</span>
            </div>
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">Registration Date</span>
              <span>{new Date(guest.Registration_Date).toLocaleDateString()}</span>
            </div>
            <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 md:col-span-2">
              <span className="text-[10px] uppercase text-acc-500 font-semibold block">Address</span>
              <span>{guest.Address || 'No Address Listed'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Reservation History */}
      {activeTab === 'reservations' && (
        <div className="panel-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-acc-100 dark:bg-acc-800 font-mono uppercase text-[10px] border-b border-acc-200">
              <tr>
                <th className="p-3">Reservation ID</th>
                <th className="p-3">Hotel Branch</th>
                <th className="p-3">Room</th>
                <th className="p-3">Check-in</th>
                <th className="p-3">Check-out</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100 font-mono">
              {reservations.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-acc-500">No reservations recorded.</td></tr>
              ) : (
                reservations.map((r: any) => (
                  <tr key={r.Reservation_ID} className="hover:bg-acc-50">
                    <td className="p-3 font-bold">#RES-{r.Reservation_ID}</td>
                    <td className="p-3 font-sans font-semibold">{r.Hotel_Name}</td>
                    <td className="p-3">Room {r.Room_Number} ({r.Room_Type})</td>
                    <td className="p-3">{new Date(r.Check_In_Date).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(r.Check_Out_Date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="badge-pill bg-acc-100 border border-acc-300 font-mono">{r.Reservation_Status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 3: Service History */}
      {activeTab === 'services' && (
        <div className="panel-card overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-acc-100 dark:bg-acc-800 uppercase text-[10px] border-b border-acc-200">
              <tr>
                <th className="p-3">Service Log ID</th>
                <th className="p-3">Service Name</th>
                <th className="p-3">Date</th>
                <th className="p-3">Quantity</th>
                <th className="p-3 text-right">Charge (BDT ৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100">
              {services.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-acc-500">No service records for this guest.</td></tr>
              ) : (
                services.map((s: any) => (
                  <tr key={s.Service_Record_ID} className="hover:bg-acc-50">
                    <td className="p-3 font-bold">#SRV-{s.Service_Record_ID}</td>
                    <td className="p-3 font-sans font-semibold">{s.Service_Name}</td>
                    <td className="p-3">{new Date(s.Service_Date).toLocaleDateString()}</td>
                    <td className="p-3 font-bold">{s.Quantity}</td>
                    <td className="p-3 text-right font-bold">৳{Number(s.Charge).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 4: Billing History */}
      {activeTab === 'bills' && (
        <div className="panel-card overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-acc-100 dark:bg-acc-800 uppercase text-[10px] border-b border-acc-200">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Billing Date</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Amount (BDT ৳)</th>
                <th className="p-3">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100">
              {bills.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-acc-500">No invoices generated yet.</td></tr>
              ) : (
                bills.map((b: any) => (
                  <tr key={b.Bill_ID} className="hover:bg-acc-50">
                    <td className="p-3 font-bold">#INV-{b.Bill_ID}</td>
                    <td className="p-3">{new Date(b.Billing_Date).toLocaleDateString()}</td>
                    <td className="p-3">{b.Payment_Method}</td>
                    <td className="p-3 font-bold">৳{Number(b.Final_Amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`badge-pill border ${b.Payment_Status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                        {b.Payment_Status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
