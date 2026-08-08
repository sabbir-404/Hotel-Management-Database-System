import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { Hotel, Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarBlank, 
  Bed, 
  Users, 
  Buildings, 
  CheckCircle, 
  CircleNotch, 
  X,
  Receipt,
  Sparkle
} from '@phosphor-icons/react';

interface GuestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHotelId?: number | null;
  onBookingSuccess?: () => void;
}

export const GuestBookingModal: React.FC<GuestBookingModalProps> = ({
  isOpen,
  onClose,
  initialHotelId,
  onBookingSuccess
}) => {
  const { user } = useAuth();
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number>(initialHotelId || 1);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysLaterStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState<string>(todayStr);
  const [checkOut, setCheckOut] = useState<string>(threeDaysLaterStr);
  const [guestCount, setGuestCount] = useState<number>(2);

  const [loadingHotels, setLoadingHotels] = useState<boolean>(true);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (initialHotelId) {
      setSelectedHotelId(initialHotelId);
    }
  }, [initialHotelId]);

  // Load hotels list
  useEffect(() => {
    if (!isOpen) return;
    const fetchHotels = async () => {
      setLoadingHotels(true);
      try {
        const res = await api.get('/hotels');
        setHotels(res.data);
        if (res.data.length > 0 && !initialHotelId) {
          setSelectedHotelId(res.data[0].Hotel_ID);
        }
      } catch (err) {
        console.error('Failed to load hotels list', err);
      } finally {
        setLoadingHotels(false);
      }
    };
    fetchHotels();
  }, [isOpen, initialHotelId]);

  // Load available rooms for selected hotel branch
  useEffect(() => {
    if (!isOpen || !selectedHotelId) return;
    const fetchHotelRooms = async () => {
      setLoadingRooms(true);
      setSelectedRoomId(null);
      try {
        const res = await api.get(`/hotels/${selectedHotelId}`);
        const rooms: Room[] = res.data.rooms || [];
        const avail = rooms.filter(r => r.Availability_Status === 'Available');
        setAvailableRooms(avail);
        if (avail.length > 0) {
          setSelectedRoomId(avail[0].Room_ID);
        }
      } catch (err) {
        console.error('Failed to load rooms for hotel', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchHotelRooms();
  }, [isOpen, selectedHotelId]);

  if (!isOpen) return null;

  // Calculate pricing breakdown
  const selectedRoom = availableRooms.find(r => r.Room_ID === selectedRoomId);
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const diffTime = endDate.getTime() - startDate.getTime();
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const nightlyRate = selectedRoom 
    ? (selectedRoom.Sale_Rate ? Number(selectedRoom.Sale_Rate) : Number(selectedRoom.Nightly_Rate))
    : 3500;
  
  const roomSubtotal = nightlyRate * nights;
  const finalTotal = roomSubtotal;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user || !user.id) {
      setErrorMsg('You must be logged in as a guest to book a room.');
      return;
    }

    if (!selectedRoomId) {
      setErrorMsg('Please select an available room for your stay.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setErrorMsg('Check-Out date must be after Check-In date.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        Guest_ID: user.id,
        Room_ID: selectedRoomId,
        Booking_Date: todayStr,
        Check_In_Date: checkIn,
        Check_Out_Date: checkOut,
        Number_of_Guests: guestCount,
        Reservation_Status: 'Confirmed'
      };

      const res = await api.post('/reservations', payload);
      const newRes = res.data;

      setSuccessMsg(`🎉 Reservation #${newRes.Reservation_ID} Confirmed! Room ${selectedRoom?.Room_Number} is booked for your stay.`);

      setTimeout(() => {
        onClose();
        if (onBookingSuccess) onBookingSuccess();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHotel = hotels.find(h => h.Hotel_ID === selectedHotelId);

  return createPortal(
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto page-fade-enter">
      <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-750 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-acc-400 hover:text-acc-900 dark:hover:text-white hover:bg-acc-100 dark:hover:bg-acc-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/15 border border-brand-500/30 rounded-full text-brand-600 dark:text-brand-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <Sparkle size={12} weight="fill" />
            <span>GUEST RESERVATION</span>
          </div>
          <h2 className="text-xl font-extrabold text-acc-950 dark:text-acc-50 tracking-tight">
            Reserve Your Hotel Stay
          </h2>
          <p className="text-xs text-acc-500 font-sans">
            Select stay schedule and room preferences with transparent real-time BDT pricing
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleConfirmBooking} className="space-y-5 text-xs font-sans">
          
          {/* Step 1: Select Hotel Branch */}
          <div className="space-y-1.5">
            <label className="block font-bold text-acc-900 dark:text-acc-100 flex items-center gap-1.5">
              <Buildings size={16} className="text-brand-500" />
              <span>1. Select Hotel Branch Location</span>
            </label>
            {loadingHotels ? (
              <div className="p-2 text-acc-400 font-mono text-[11px] flex items-center gap-2">
                <CircleNotch size={14} className="animate-spin" /> Loading hotel branches...
              </div>
            ) : (
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl text-xs font-bold text-acc-950 dark:text-acc-50 focus:ring-2 focus:ring-brand-500"
              >
                {hotels.map(h => (
                  <option key={h.Hotel_ID} value={h.Hotel_ID}>
                    {h.Hotel_Name} — {h.City} ({h.Star_Rating}-Star)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Stay Dates & Guests Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium mb-1 text-acc-700 dark:text-acc-300 flex items-center gap-1">
                <CalendarBlank size={14} className="text-brand-500" />
                <span>Check-In Date *</span>
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl text-xs font-mono text-acc-950 dark:text-acc-50"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-acc-700 dark:text-acc-300 flex items-center gap-1">
                <CalendarBlank size={14} className="text-brand-500" />
                <span>Check-Out Date *</span>
              </label>
              <input
                type="date"
                required
                min={checkIn}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl text-xs font-mono text-acc-950 dark:text-acc-50"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-acc-700 dark:text-acc-300 flex items-center gap-1">
                <Users size={14} className="text-brand-500" />
                <span>Guests *</span>
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl text-xs font-mono text-acc-950 dark:text-acc-50"
              />
            </div>
          </div>

          {/* Step 3: Room Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-acc-900 dark:text-acc-100 flex items-center gap-1.5">
              <Bed size={16} className="text-brand-500" />
              <span>2. Choose Available Room ({availableRooms.length} Available)</span>
            </label>

            {loadingRooms ? (
              <div className="p-4 text-center text-acc-500 font-mono text-xs flex items-center justify-center gap-2">
                <CircleNotch size={16} className="animate-spin text-brand-500" />
                <span>Checking live room inventory...</span>
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs text-center font-mono">
                No rooms currently available at {selectedHotel?.Hotel_Name}. Please select another hotel branch.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                {availableRooms.map((room) => {
                  const isSelected = selectedRoomId === room.Room_ID;
                  const rate = room.Sale_Rate ? Number(room.Sale_Rate) : Number(room.Nightly_Rate);
                  return (
                    <div
                      key={room.Room_ID}
                      onClick={() => setSelectedRoomId(room.Room_ID)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/15 ring-2 ring-brand-500'
                          : 'border-acc-200 dark:border-acc-750 bg-acc-50 dark:bg-acc-850 hover:border-brand-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-sm text-acc-950 dark:text-acc-50">
                            Room {room.Room_Number} ({room.Room_Type})
                          </div>
                          <div className="text-[11px] text-acc-500 font-mono">
                            Floor {room.Floor_Number} • Max {room.Capacity} Guests
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle size={18} weight="fill" className="text-brand-500 shrink-0" />
                        )}
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-acc-200/60 dark:border-acc-700/60 font-mono">
                        <span className="text-[10px] text-acc-400">Nightly Rate</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          BDT {rate.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Summary Card */}
          {selectedRoom && (
            <div className="p-4 bg-acc-950 text-white rounded-xl space-y-2 font-mono text-xs border border-acc-800 shadow-inner">
              <div className="flex justify-between items-center border-b border-acc-800 pb-2">
                <span className="font-bold flex items-center gap-1.5 text-brand-400">
                  <Receipt size={16} /> Estimated Invoice Summary
                </span>
                <span className="text-[11px] text-acc-400">{nights} Night(s)</span>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between text-acc-300">
                  <span>Room Charge (BDT {nightlyRate.toLocaleString()} × {nights} nights)</span>
                  <span>BDT {roomSubtotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-acc-800 text-sm font-extrabold text-white">
                <span>Total Amount Payable</span>
                <span className="text-brand-400 text-base">BDT {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedRoomId}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-acc-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 font-mono"
            >
              {submitting ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Confirming Reservation...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Book Reservation</span>
                  <CheckCircle size={18} weight="fill" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
