import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Reservation, Service } from '../types';
import { GuestBookingModal } from '../components/GuestBookingModal';
import { 
  User, 
  CalendarCheck, 
  Bed, 
  Plus, 
  Receipt, 
  BellRinging, 
  Clock, 
  Sparkle, 
  CheckCircle, 
  XCircle, 
  PencilSimple, 
  CircleNotch,
  ArrowRight,
  ShieldCheck,
  House
} from '@phosphor-icons/react';

export const GuestDashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [guestProfile, setGuestProfile] = useState<any>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Guest Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [initialHotelId, setInitialHotelId] = useState<number | null>(null);

  // Edit Stay Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    Check_In_Date: '',
    Check_Out_Date: '',
    Number_of_Guests: 1
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState<number | null>(null);

  // Service Request State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(1);
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);
  const [requestingService, setRequestingService] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Check URL query parameters for instant booking modal trigger
  useEffect(() => {
    const hotelIdParam = searchParams.get('bookHotelId');
    if (hotelIdParam) {
      setInitialHotelId(parseInt(hotelIdParam));
      setIsBookingModalOpen(true);
    }
  }, [searchParams]);

  const loadGuestData = async () => {
    if (!token || !user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch guest profile summary & history
      const [profileRes, servicesRes] = await Promise.all([
        api.get(`/guests/profile/${user.id}`),
        api.get('/services')
      ]);

      setGuestProfile(profileRes.data);
      const resList: Reservation[] = profileRes.data.reservations || [];
      setReservations(resList);
      setServicesList(servicesRes.data || []);

      // Auto-select first active reservation for service orders
      const active = resList.filter(r => r.Reservation_Status !== 'Checked Out' && r.Reservation_Status !== 'Cancelled');
      if (active.length > 0) {
        setSelectedReservationId(active[0].Reservation_ID);
      }
    } catch (err) {
      console.error('Failed to load guest dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuestData();
  }, [token, user]);

  const openEditModal = (resItem: Reservation) => {
    setEditingRes(resItem);
    setEditForm({
      Check_In_Date: resItem.Check_In_Date ? resItem.Check_In_Date.split('T')[0] : '',
      Check_Out_Date: resItem.Check_Out_Date ? resItem.Check_Out_Date.split('T')[0] : '',
      Number_of_Guests: resItem.Number_of_Guests || 1
    });
    setEditModalOpen(true);
  };

  const handleUpdateStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes) return;

    setIsUpdating(true);
    try {
      await api.put(`/reservations/${editingRes.Reservation_ID}`, editForm);
      setFeedbackMsg(`✓ Stay schedule updated for Reservation #${editingRes.Reservation_ID}`);
      setEditModalOpen(false);
      loadGuestData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update stay dates');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelStay = async (reservationId: number) => {
    if (!confirm(`Are you sure you want to cancel Reservation #${reservationId}?`)) return;

    setIsCancelling(reservationId);
    try {
      await api.put(`/reservations/${reservationId}`, { Reservation_Status: 'Cancelled' });
      setFeedbackMsg(`✓ Reservation #${reservationId} has been cancelled.`);
      loadGuestData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setIsCancelling(null);
    }
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return;

    const activeResList = reservations.filter(r => r.Reservation_Status !== 'Checked Out' && r.Reservation_Status !== 'Cancelled');
    if (activeResList.length > 0 && !selectedReservationId) {
      alert('Please select the active hotel booking this service applies to.');
      return;
    }

    setRequestingService(true);

    try {
      const selectedService = servicesList.find(s => s.Service_ID === selectedServiceId);
      const unitCharge = selectedService ? Number(selectedService.Service_Charge) : 500;

      await api.post('/services/records', {
        Guest_ID: user.id,
        Service_ID: selectedServiceId,
        Reservation_ID: selectedReservationId,
        Service_Date: new Date().toISOString().split('T')[0],
        Quantity: serviceQuantity,
        Charge: unitCharge * serviceQuantity,
        Total_Cost: unitCharge * serviceQuantity
      });

      setFeedbackMsg(`✓ Service request for ${selectedService?.Service_Name || 'Amenity'} submitted to front desk!`);
      setServiceModalOpen(false);
      loadGuestData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit service request');
    } finally {
      setRequestingService(false);
    }
  };

  if (!token) {
    return (
      <div className="py-12 max-w-md mx-auto page-fade-enter text-center">
        <div className="panel-card p-8 space-y-5 border border-acc-200 dark:border-acc-800 shadow-md">
          <div className="w-14 h-14 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <User size={30} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-acc-950 dark:text-acc-50">Guest Sign-In Required</h2>
            <p className="text-xs text-acc-500 font-sans">
              Please sign in to access your guest dashboard, active stays, and booking history.
            </p>
          </div>
          <div className="pt-2 flex gap-3">
            <Link to="/guest-login" className="flex-1 py-2.5 bg-brand-500 text-acc-950 font-bold text-xs rounded shadow">
              Guest Sign In
            </Link>
            <Link to="/register" className="flex-1 py-2.5 border border-acc-300 dark:border-acc-700 text-acc-950 dark:text-acc-100 font-bold text-xs rounded">
              Register Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeReservations = reservations.filter(r => r.Reservation_Status === 'Confirmed' || r.Reservation_Status === 'Checked In' || r.Reservation_Status === 'Pending');
  const pastReservations = reservations.filter(r => r.Reservation_Status === 'Checked Out');
  const summary = guestProfile?.summary || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto page-fade-enter pb-12">
      
      {/* Top Welcome Header Banner */}
      <div className="panel-card p-6 md:p-8 bg-gradient-to-r from-acc-950 via-acc-900 to-brand-950 text-white rounded-2xl shadow-xl border border-acc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="badge-pill bg-brand-500 text-acc-950 font-mono text-[9px] font-extrabold uppercase">
              CUSTOMER GUEST PORTAL
            </span>
            <span className="text-xs font-mono text-acc-300">Profile #{user?.id || 'GST'}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Welcome back, {guestProfile?.guest?.First_Name || user?.name?.split(' ')[0] || 'Valued Guest'}! 👋
          </h1>

          <p className="text-xs text-acc-300 font-sans max-w-xl">
            Manage your verified hotel reservations, explore properties across Bangladesh, and request stay amenities directly from your portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => {
              setInitialHotelId(null);
              setIsBookingModalOpen(true);
            }}
            className="px-5 py-3 bg-brand-500 hover:bg-brand-400 text-acc-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} weight="bold" />
            <span>Book New Hotel Stay</span>
          </button>
          
          <Link
            to="/hotels"
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition-all"
          >
            <House size={16} />
            <span>Browse Hotels</span>
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-sm">
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Summary Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="panel-card p-4 space-y-2 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all">
          <div className="flex justify-between items-center text-acc-500 text-xs font-mono">
            <span>Active Stays</span>
            <CalendarCheck size={18} className="text-brand-500" />
          </div>
          <div className="text-2xl font-extrabold text-acc-950 dark:text-acc-50 font-mono">
            {activeReservations.length}
          </div>
          <div className="text-[10px] text-acc-400 font-mono">
            Upcoming & Checked-In
          </div>
        </div>

        <div className="panel-card p-4 space-y-2 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all">
          <div className="flex justify-between items-center text-acc-500 text-xs font-mono">
            <span>Completed Stays</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-acc-950 dark:text-acc-50 font-mono">
            {summary.previousReservations || pastReservations.length || 0}
          </div>
          <div className="text-[10px] text-acc-400 font-mono">
            Past Checked-Out Stays
          </div>
        </div>

        <div className="panel-card p-4 space-y-2 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all">
          <div className="flex justify-between items-center text-acc-500 text-xs font-mono">
            <span>Total Spent</span>
            <Receipt size={18} className="text-brand-500" />
          </div>
          <div className="text-2xl font-extrabold text-acc-950 dark:text-acc-50 font-mono">
            BDT ৳{Number(summary.totalSpent || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-acc-400 font-mono">
            Cumulative Invoice Total
          </div>
        </div>

        <div className="panel-card p-4 space-y-2 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all">
          <div className="flex justify-between items-center text-acc-500 text-xs font-mono">
            <span>Identification</span>
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-xs font-extrabold text-acc-950 dark:text-acc-50 font-mono truncate">
            {guestProfile?.guest?.Identification_Number || 'Verified Guest'}
          </div>
          <div className="text-[10px] text-acc-400 font-mono">
            {guestProfile?.guest?.Nationality || 'Bangladeshi'}
          </div>
        </div>

      </div>

      {/* Main Stays Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-acc-950 dark:text-acc-50 flex items-center gap-2">
              <CalendarCheck size={20} className="text-brand-500" />
              <span>Your Active Hotel Stays & Reservations</span>
            </h2>
            <p className="text-xs text-acc-500 font-sans">
              View check-in schedules, change stay dates, or order in-room service desk amenities.
            </p>
          </div>

          <button
            onClick={() => {
              setInitialHotelId(null);
              setIsBookingModalOpen(true);
            }}
            className="px-3.5 py-2 bg-brand-500 text-acc-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 font-mono"
          >
            <Plus size={16} />
            <span>New Booking</span>
          </button>
        </div>

        {loading ? (
          <div className="panel-card p-8 text-center text-acc-500 font-mono text-xs flex items-center justify-center gap-2">
            <CircleNotch size={18} className="animate-spin text-brand-500" />
            <span>Loading your booking records...</span>
          </div>
        ) : activeReservations.length === 0 ? (
          <div className="panel-card p-8 text-center space-y-4 border border-dashed border-acc-300 dark:border-acc-700">
            <div className="w-12 h-12 rounded-full bg-acc-100 dark:bg-acc-800 flex items-center justify-center mx-auto text-acc-400">
              <Bed size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-acc-950 dark:text-acc-100">No Active Stays Right Now</h3>
              <p className="text-xs text-acc-500 font-sans max-w-sm mx-auto">
                You do not have any upcoming room reservations. Book a luxury room at our hotels across Dhaka, Cox's Bazar, Sylhet, and more!
              </p>
            </div>
            <button
              onClick={() => {
                setInitialHotelId(null);
                setIsBookingModalOpen(true);
              }}
              className="px-4 py-2.5 bg-brand-500 text-acc-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow"
            >
              <Plus size={16} />
              <span>Reserve a Room Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeReservations.map((r) => {
              const checkIn = new Date(r.Check_In_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const checkOut = new Date(r.Check_Out_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const nightly = Number(r.Nightly_Rate || 3500);
              const nights = r.Total_Nights || 2;
              const totalEst = nightly * nights;

              return (
                <div
                  key={r.Reservation_ID}
                  className="panel-card p-5 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all shadow-md space-y-4 rounded-xl"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-acc-100 dark:border-acc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-acc-950 dark:text-acc-50">
                        Reservation #{r.Reservation_ID}
                      </span>
                      <span className="badge-pill border font-mono text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                        {r.Reservation_Status}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-acc-500">
                      Primary Guest: <strong className="text-acc-900 dark:text-acc-200">{guestProfile?.guest?.First_Name} {guestProfile?.guest?.Last_Name}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-brand-600 dark:text-brand-400 font-sans">
                        {r.Hotel_Name || 'Hotel.com Luxury Branch'}
                      </div>
                      <div className="flex items-center gap-1 text-acc-600 dark:text-acc-400">
                        <Bed size={15} className="text-brand-500" />
                        <span>Room {r.Room_Number} ({r.Room_Type || 'Deluxe'})</span>
                      </div>
                      <div className="text-acc-500 text-[11px]">
                        Guests: {r.Number_of_Guests || 1} Person(s)
                      </div>
                    </div>

                    <div className="space-y-1 bg-acc-50 dark:bg-acc-850 p-3 rounded-xl border border-acc-200 dark:border-acc-800">
                      <div className="text-acc-500 text-[10px] uppercase font-bold">Stay Schedule</div>
                      <div className="font-semibold text-acc-900 dark:text-acc-100">
                        {checkIn} ➔ {checkOut}
                      </div>
                      <div className="text-acc-500 text-[11px]">
                        Duration: {nights} Night(s)
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="text-acc-500 text-[10px] uppercase font-bold">Estimated Rate</div>
                      <div className="text-lg font-extrabold text-acc-950 dark:text-acc-50">
                        BDT ৳{totalEst.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-acc-500">
                        BDT ৳{nightly.toLocaleString()} / night
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-acc-100 dark:border-acc-800 gap-2">
                    <div className="text-[11px] font-mono text-acc-500">
                      {r.Payment_Status ? `Invoice Payment: ${r.Payment_Status}` : 'Payable on Check-In at Property'}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedReservationId(r.Reservation_ID);
                          setServiceModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-colors font-bold"
                      >
                        <BellRinging size={14} />
                        <span>Order In-Stay Service</span>
                      </button>

                      <button
                        onClick={() => openEditModal(r)}
                        className="px-3.5 py-2 border border-acc-300 dark:border-acc-700 text-acc-950 dark:text-acc-100 hover:bg-acc-100 dark:hover:bg-acc-800 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <PencilSimple size={14} />
                        <span>Change Dates</span>
                      </button>

                      <button
                        onClick={() => handleCancelStay(r.Reservation_ID)}
                        disabled={isCancelling === r.Reservation_ID}
                        className="px-3.5 py-2 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-colors"
                      >
                        {isCancelling === r.Reservation_ID ? <CircleNotch size={14} className="animate-spin" /> : <XCircle size={14} />}
                        <span>Cancel Booking</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Grid: Guest Profile Card & Extra Amenities Service Desk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Personal Profile Details Card */}
        <div className="panel-card p-6 border border-acc-200 dark:border-acc-800 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-acc-100 dark:border-acc-800 pb-3">
            <div className="font-extrabold text-sm text-acc-950 dark:text-acc-50 flex items-center gap-2">
              <User size={18} className="text-brand-500" />
              <span>Guest Personal Details</span>
            </div>
            <span className="text-[10px] font-mono text-acc-400">Verified Customer</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-acc-50 dark:border-acc-850">
              <span className="text-acc-500">Full Name</span>
              <span className="font-bold text-acc-950 dark:text-acc-100">{guestProfile?.guest?.First_Name} {guestProfile?.guest?.Last_Name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-acc-50 dark:border-acc-850">
              <span className="text-acc-500">Email Address</span>
              <span className="font-bold text-acc-950 dark:text-acc-100">{guestProfile?.guest?.Email || 'Not specified'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-acc-50 dark:border-acc-850">
              <span className="text-acc-500">Phone Number</span>
              <span className="font-bold text-acc-950 dark:text-acc-100">{guestProfile?.guest?.Phone_Number || 'Not specified'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-acc-50 dark:border-acc-850">
              <span className="text-acc-500">Nationality</span>
              <span className="font-bold text-acc-950 dark:text-acc-100">{guestProfile?.guest?.Nationality || 'Bangladeshi'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-acc-500">ID / Passport</span>
              <span className="font-bold text-acc-950 dark:text-acc-100">{guestProfile?.guest?.Identification_Number || 'NID-Verified'}</span>
            </div>
          </div>
        </div>

        {/* In-Stay Hotel Service Desk Card */}
        <div className="panel-card p-6 border border-acc-200 dark:border-acc-800 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-acc-100 dark:border-acc-800 pb-3">
            <div className="font-extrabold text-sm text-acc-950 dark:text-acc-50 flex items-center gap-2">
              <BellRinging size={18} className="text-brand-500" />
              <span>In-Stay Hotel Services</span>
            </div>
            <button
              onClick={() => {
                if (activeReservations.length > 0 && !selectedReservationId) {
                  setSelectedReservationId(activeReservations[0].Reservation_ID);
                }
                setServiceModalOpen(true);
              }}
              className="text-xs font-mono text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              + Request Service
            </button>
          </div>

          <p className="text-xs text-acc-500 font-sans">
            Enhance your stay with 24/7 spa therapies, express laundry, airport transfers, and room dining trays.
          </p>

          <div className="space-y-2">
            {servicesList.slice(0, 3).map((srv) => (
              <div
                key={srv.Service_ID}
                className="p-3 bg-acc-50 dark:bg-acc-850 rounded-xl border border-acc-200 dark:border-acc-800 flex justify-between items-center text-xs font-mono"
              >
                <div>
                  <div className="font-bold text-acc-950 dark:text-acc-50">{srv.Service_Name}</div>
                  <div className="text-[10px] text-acc-500">{srv.Service_Description}</div>
                </div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  BDT ৳{Number(srv.Service_Charge).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Guest Booking Modal Component */}
      <GuestBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialHotelId={initialHotelId}
        onBookingSuccess={() => {
          setIsBookingModalOpen(false);
          loadGuestData();
        }}
      />

      {/* Change Stay Dates Modal */}
      {editModalOpen && editingRes && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 pb-2">
              Update Stay Dates for Reservation #{editingRes.Reservation_ID}
            </h3>

            <form onSubmit={handleUpdateStay} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-medium mb-1">Check-In Date *</label>
                <input
                  type="date"
                  required
                  value={editForm.Check_In_Date}
                  onChange={(e) => setEditForm({ ...editForm, Check_In_Date: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Check-Out Date *</label>
                <input
                  type="date"
                  required
                  value={editForm.Check_Out_Date}
                  onChange={(e) => setEditForm({ ...editForm, Check_Out_Date: e.target.value })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={editForm.Number_of_Guests}
                  onChange={(e) => setEditForm({ ...editForm, Number_of_Guests: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-2 border border-acc-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-brand-500 text-acc-950 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  {isUpdating ? <CircleNotch size={14} className="animate-spin" /> : null}
                  <span>Save New Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Service Desk Request Modal */}
      {serviceModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 pb-2">
              Request In-Stay Service
            </h3>

            <form onSubmit={handleRequestService} className="space-y-3 text-xs">
              
              {/* Hotel Booking / Stay Selection */}
              <div>
                <label className="block font-medium mb-1 text-acc-950 dark:text-acc-50 font-bold">
                  Select Associated Hotel Booking / Room Stay *
                </label>
                {activeReservations.length > 0 ? (
                  <select
                    value={selectedReservationId || ''}
                    onChange={(e) => setSelectedReservationId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono text-acc-950 dark:text-acc-50 font-bold"
                    required
                  >
                    <option value="" disabled>-- Select Your Active Booking --</option>
                    {activeReservations.map(r => (
                      <option key={r.Reservation_ID} value={r.Reservation_ID}>
                        Booking #{r.Reservation_ID} - Room {r.Room_Number || r.Room_ID} ({r.Hotel_Name || 'Hotel'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs font-mono">
                    No active hotel bookings found. Please book a room first to request in-stay services.
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1">Select Hotel Service *</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono text-acc-950 dark:text-acc-50 font-bold"
                >
                  {servicesList.map(s => (
                    <option key={s.Service_ID} value={s.Service_ID}>
                      {s.Service_Name} (BDT ৳{Number(s.Service_Charge).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={serviceQuantity}
                  onChange={(e) => setServiceQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-3.5 py-2 border border-acc-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingService || (activeReservations.length > 0 && !selectedReservationId)}
                  className="px-4 py-2 bg-brand-500 text-acc-950 font-bold text-xs rounded-xl flex items-center gap-1 font-mono disabled:opacity-50"
                >
                  {requestingService ? <CircleNotch size={14} className="animate-spin" /> : null}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
