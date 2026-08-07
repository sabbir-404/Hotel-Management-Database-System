import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Guest, Room, Hotel, Reservation } from '../types';
import { 
  UserCheck, 
  Building, 
  Bed, 
  CalendarCheck, 
  Calculator, 
  CheckCircle, 
  MagnifyingGlass, 
  UserPlus, 
  ArrowRight, 
  ArrowLeft,
  Sparkle
} from '@phosphor-icons/react';

export const BookingWizardPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Loaded dataset
  const [guests, setGuests] = useState<Guest[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Step 1: Guest Selection state
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isRegisteringNewGuest, setIsRegisteringNewGuest] = useState(false);
  const [newGuestForm, setNewGuestForm] = useState({
    First_Name: '',
    Last_Name: '',
    Phone_Number: '',
    Email: '',
    Address: '',
    Nationality: 'Bangladeshi',
    Identification_Number: ''
  });

  // Step 2 & 3 & 4: Hotel, Type, Room Selection
  const [selectedHotelId, setSelectedHotelId] = useState<number>(1);
  const [selectedRoomType, setSelectedRoomType] = useState<'Single' | 'Double' | 'Deluxe' | 'Suite'>('Single');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Step 5: Booking Details
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [numberOfGuests, setNumberOfGuests] = useState<number>(2);

  // Step 6: Confirmation result
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, hRes, rRes] = await Promise.all([
        api.get('/guests'),
        api.get('/hotels'),
        api.get('/rooms')
      ]);
      setGuests(gRes.data);
      setHotels(hRes.data);
      setRooms(rRes.data);

      if (gRes.data.length > 0) setSelectedGuest(gRes.data[0]);
      if (hRes.data.length > 0) setSelectedHotelId(hRes.data[0].Hotel_ID);
    } catch (err) {
      console.error('Failed to load booking dataset', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter available rooms matching step 2 & 3
  const availableRooms = rooms.filter(r => 
    r.Hotel_ID === selectedHotelId &&
    r.Room_Type === selectedRoomType &&
    r.Availability_Status === 'Available'
  );

  // Automated pricing math
  const cIn = new Date(checkInDate);
  const cOut = new Date(checkOutDate);
  const calculatedNights = Math.max(1, Math.round((cOut.getTime() - cIn.getTime()) / (1000 * 3600 * 24)));
  const calculatedCost = selectedRoom ? Number(selectedRoom.Nightly_Rate) * calculatedNights : 0;

  // Registration handler for inline guest creation in Step 1
  const handleRegisterInlineGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/guests', newGuestForm);
      setSelectedGuest(res.data);
      setIsRegisteringNewGuest(false);
      // Refresh guests
      const gRes = await api.get('/guests');
      setGuests(gRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to register guest');
    }
  };

  // Final Confirmation Submit
  const handleFinalConfirm = async () => {
    if (!selectedGuest || !selectedRoom) {
      alert('Missing guest or room selection');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/reservations', {
        Guest_ID: selectedGuest.Guest_ID,
        Room_ID: selectedRoom.Room_ID,
        Check_In_Date: checkInDate,
        Check_Out_Date: checkOutDate,
        Number_of_Guests: numberOfGuests
      });

      setConfirmedReservation(res.data);
      setStep(7); // Show final confirmation screen
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to confirm reservation');
    } finally {
      setLoading(false);
    }
  };

  const selectedHotel = hotels.find(h => h.Hotel_ID === selectedHotelId);

  const filteredGuestList = guests.filter(g =>
    g.Guest_ID.toString().includes(guestSearch) ||
    `${g.First_Name} ${g.Last_Name}`.toLowerCase().includes(guestSearch.toLowerCase()) ||
    g.Phone_Number.includes(guestSearch) ||
    g.Identification_Number.toLowerCase().includes(guestSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50 flex items-center gap-2">
          <Sparkle className="text-brand-500" size={20} />
          <span>6-Step Guided Hotel Booking Module</span>
        </h1>
        <p className="text-xs text-acc-500 font-mono">
          Interactive reservation wizard stem from Guest ➔ Hotel ➔ Room ➔ Cost ➔ Live MySQL Reservation
        </p>
      </div>

      {/* Progress Bar Steps Indicator */}
      {step <= 6 && (
        <div className="grid grid-cols-6 gap-1 border-b border-acc-200 dark:border-acc-800 pb-3">
          {[
            { num: 1, label: 'Select Guest' },
            { num: 2, label: 'Choose Hotel' },
            { num: 3, label: 'Room Type' },
            { num: 4, label: 'Available Room' },
            { num: 5, label: 'Dates & Cost' },
            { num: 6, label: 'Review & Confirm' }
          ].map(s => (
            <div key={s.num} className={`text-center py-2 px-1 rounded transition-all ${
              step === s.num
                ? 'bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold'
                : step > s.num
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                : 'bg-acc-100 dark:bg-acc-850 text-acc-500'
            }`}>
              <div className="text-[10px] font-mono uppercase">Step {s.num}</div>
              <div className="text-[11px] font-sans truncate">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Select Guest */}
      {step === 1 && (
        <div className="panel-card p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-acc-100 dark:border-acc-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50">Step 1 — Select or Register Guest</h3>
              <p className="text-xs text-acc-500 font-mono">Search by Guest ID, Phone Number, Name, or NID/Passport</p>
            </div>

            <button
              onClick={() => setIsRegisteringNewGuest(!isRegisteringNewGuest)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs rounded"
            >
              <UserPlus size={14} />
              <span>{isRegisteringNewGuest ? 'Search Existing' : 'Register New Guest'}</span>
            </button>
          </div>

          {isRegisteringNewGuest ? (
            <form onSubmit={handleRegisterInlineGuest} className="space-y-3 bg-acc-50 dark:bg-acc-850 p-4 rounded border border-acc-200 dark:border-acc-800">
              <h4 className="text-xs font-mono font-bold uppercase text-acc-600">Register Guest Directly</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="First Name *"
                  value={newGuestForm.First_Name}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, First_Name: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Last Name *"
                  value={newGuestForm.Last_Name}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, Last_Name: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Phone Number (+880...) *"
                  value={newGuestForm.Phone_Number}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, Phone_Number: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                />
                <input
                  type="text"
                  required
                  placeholder="National ID / Passport Number *"
                  value={newGuestForm.Identification_Number}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, Identification_Number: e.target.value })}
                  className="px-3 py-1.5 bg-white dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={newGuestForm.Email}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, Email: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded"
              >
                Register & Select Guest
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Search by Guest ID, Phone (+880...), Name, or NID/Passport..."
                  className="w-full pl-9 pr-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-acc-200 dark:border-acc-800 rounded p-2">
                {filteredGuestList.map(g => (
                  <div
                    key={g.Guest_ID}
                    onClick={() => setSelectedGuest(g)}
                    className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-all ${
                      selectedGuest?.Guest_ID === g.Guest_ID
                        ? 'bg-acc-950 text-white dark:bg-acc-800 dark:text-brand-400 border-acc-950 font-semibold'
                        : 'bg-white dark:bg-acc-900 border-acc-200 dark:border-acc-800 hover:bg-acc-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{g.First_Name} {g.Last_Name}</h4>
                      <p className="text-[11px] font-mono opacity-80">{g.Phone_Number} | NID: {g.Identification_Number}</p>
                    </div>
                    <span className="text-xs font-mono font-bold">#GST-{g.Guest_ID}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedGuest && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-xs text-emerald-800 dark:text-emerald-300 flex justify-between items-center">
              <span>Selected Guest: <strong>{selectedGuest.First_Name} {selectedGuest.Last_Name}</strong> (#GST-{selectedGuest.Guest_ID})</span>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded flex items-center gap-1"
              >
                <span>Next: Choose Hotel</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Choose Hotel Branch */}
      {step === 2 && (
        <div className="panel-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Step 2 — Choose Hotel Branch in Bangladesh
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotels.map(h => (
              <div
                key={h.Hotel_ID}
                onClick={() => setSelectedHotelId(h.Hotel_ID)}
                className={`p-4 rounded border cursor-pointer space-y-2 transition-all ${
                  selectedHotelId === h.Hotel_ID
                    ? 'border-acc-950 bg-acc-950 text-white dark:bg-acc-800 dark:border-brand-500 shadow'
                    : 'border-acc-200 bg-white dark:bg-acc-900 hover:bg-acc-50'
                }`}
              >
                <span className="badge-pill bg-brand-500 text-acc-950 font-mono text-[9px]">
                  {h.City} Branch
                </span>
                <h4 className="font-bold text-sm">{h.Hotel_Name}</h4>
                <p className="text-xs opacity-80">{h.Address}</p>
                <p className="text-[11px] font-mono">Contact: {h.Contact_Number}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-acc-100 dark:border-acc-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-acc-300 text-xs rounded flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded flex items-center gap-1"
            >
              <span>Next: Room Type</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Choose Room Type */}
      {step === 3 && (
        <div className="panel-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Step 3 — Choose Room Type
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'Single', desc: '1 Guest, cozy single bed', approx: '৳3,500/night' },
              { type: 'Double', desc: '2 Guests, king/queen bed', approx: '৳6,500/night' },
              { type: 'Deluxe', desc: '2-4 Guests, ocean/city balcony view', approx: '৳12,000/night' },
              { type: 'Suite', desc: 'Executive luxury living lounge & 4+ capacity', approx: '৳18,000/night' }
            ].map(item => (
              <div
                key={item.type}
                onClick={() => setSelectedRoomType(item.type as any)}
                className={`p-4 rounded border cursor-pointer space-y-2 transition-all ${
                  selectedRoomType === item.type
                    ? 'border-acc-950 bg-acc-950 text-white dark:bg-acc-800 dark:border-brand-500 shadow'
                    : 'border-acc-200 bg-white dark:bg-acc-900 hover:bg-acc-50'
                }`}
              >
                <h4 className="font-bold text-sm">{item.type} Room</h4>
                <p className="text-xs opacity-80">{item.desc}</p>
                <p className="text-xs font-mono font-bold text-brand-400">{item.approx}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-acc-100 dark:border-acc-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-acc-300 text-xs rounded flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded flex items-center gap-1"
            >
              <span>Next: Select Available Room</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Available Rooms */}
      {step === 4 && (
        <div className="panel-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Step 4 — Select Available Room (Availability_Status = 'Available')
          </h3>

          {availableRooms.length === 0 ? (
            <div className="p-8 text-center text-acc-500 font-mono text-xs border border-dashed border-acc-300 rounded">
              No rooms currently available for <strong>{selectedRoomType}</strong> at <strong>{selectedHotel?.Hotel_Name}</strong>. Please choose a different room type or branch.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableRooms.map(r => (
                <div
                  key={r.Room_ID}
                  onClick={() => setSelectedRoom(r)}
                  className={`p-4 rounded border cursor-pointer space-y-2 transition-all ${
                    selectedRoom?.Room_ID === r.Room_ID
                      ? 'border-acc-950 bg-acc-950 text-white dark:bg-acc-800 dark:border-brand-500 shadow'
                      : 'border-acc-200 bg-white dark:bg-acc-900 hover:bg-acc-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm font-mono">Room {r.Room_Number}</h4>
                    <span className="badge-pill bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px]">
                      Available
                    </span>
                  </div>
                  <p className="text-xs opacity-80">Floor {r.Floor_Number} | Capacity: {r.Capacity} Guests</p>
                  <p className="text-sm font-mono font-bold text-brand-400">৳{Number(r.Nightly_Rate).toLocaleString('en-US')}/night</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-acc-100 dark:border-acc-800">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-acc-300 text-xs rounded flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              disabled={!selectedRoom}
              onClick={() => setStep(5)}
              className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded flex items-center gap-1 disabled:opacity-50"
            >
              <span>Next: Booking Dates & Cost</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Reservation Details & Auto Calculator */}
      {step === 5 && (
        <div className="panel-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Step 5 — Choose Stay Dates & Guest Count
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Check-in Date *</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Check-out Date *</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Number of Guests</label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.Capacity || 4}
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          {/* Automated Realtime Cost Breakdown Card */}
          <div className="p-4 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 font-mono text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-acc-950 dark:text-acc-50">
              <Calculator size={18} />
              <span>Automated BDT (৳) Pricing Calculation</span>
            </div>
            <div className="flex justify-between text-acc-600 dark:text-acc-300">
              <span>Selected Room:</span>
              <span>Room {selectedRoom?.Room_Number} ({selectedRoom?.Room_Type})</span>
            </div>
            <div className="flex justify-between text-acc-600 dark:text-acc-300">
              <span>Nightly Rate:</span>
              <span>৳{Number(selectedRoom?.Nightly_Rate || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-acc-600 dark:text-acc-300">
              <span>Calculated Stay Duration:</span>
              <span>{calculatedNights} Night(s)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-acc-950 dark:text-acc-50 pt-2 border-t border-acc-200 dark:border-acc-700">
              <span>Estimated Total Room Cost:</span>
              <span className="text-emerald-600 dark:text-emerald-400">৳{calculatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-acc-100 dark:border-acc-800">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 border border-acc-300 text-xs rounded flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(6)}
              className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded flex items-center gap-1"
            >
              <span>Review Booking Summary</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation & Review */}
      {step === 6 && (
        <div className="panel-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
            Step 6 — Final Booking Review & Confirmation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 text-xs font-mono">
            <div>
              <p className="text-[10px] uppercase text-acc-500 font-semibold">Guest Information</p>
              <p className="font-bold text-sm text-acc-950 dark:text-acc-50 mt-1">{selectedGuest?.First_Name} {selectedGuest?.Last_Name}</p>
              <p>Phone: {selectedGuest?.Phone_Number}</p>
              <p>NID/Passport: {selectedGuest?.Identification_Number}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-acc-500 font-semibold">Hotel & Room Details</p>
              <p className="font-bold text-sm text-acc-950 dark:text-acc-50 mt-1">{selectedHotel?.Hotel_Name} ({selectedHotel?.City})</p>
              <p>Room {selectedRoom?.Room_Number} ({selectedRoom?.Room_Type})</p>
              <p>Nightly Rate: ৳{Number(selectedRoom?.Nightly_Rate || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-acc-500 font-semibold">Stay Schedule</p>
              <p>Check-in: {new Date(checkInDate).toLocaleDateString()}</p>
              <p>Check-out: {new Date(checkOutDate).toLocaleDateString()}</p>
              <p>Guests: {numberOfGuests} Person(s)</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-acc-500 font-semibold">Estimated Total Cost</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ৳{calculatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-acc-500">({calculatedNights} Night(s) Stay)</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-acc-100 dark:border-acc-800">
            <button
              onClick={() => setStep(5)}
              className="px-4 py-2 border border-acc-300 text-xs rounded flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Modify Details</span>
            </button>
            <button
              disabled={loading}
              onClick={handleFinalConfirm}
              className="px-6 py-2.5 bg-brand-500 text-acc-950 font-extrabold text-xs rounded flex items-center gap-2 shadow hover:bg-brand-600 transition-all"
            >
              <CheckCircle size={18} />
              <span>{loading ? 'Creating Booking...' : 'Confirm Reservation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: Booking Confirmation Card Result */}
      {step === 7 && confirmedReservation && (
        <div className="panel-card p-8 text-center space-y-4 border-emerald-500 border-2">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-acc-950 dark:text-acc-50">
            Reservation Confirmed!
          </h2>
          <p className="text-xs font-mono text-acc-500">
            Reservation ID generated: <strong className="text-acc-950 dark:text-acc-100 font-bold text-sm">#RES-{confirmedReservation.Reservation_ID}</strong>
          </p>

          <div className="p-4 bg-acc-50 dark:bg-acc-850 rounded max-w-md mx-auto text-xs font-mono text-left space-y-1">
            <p><strong>Guest:</strong> {selectedGuest?.First_Name} {selectedGuest?.Last_Name}</p>
            <p><strong>Hotel:</strong> {selectedHotel?.Hotel_Name}</p>
            <p><strong>Room:</strong> Room {selectedRoom?.Room_Number}</p>
            <p><strong>Room Status Updated:</strong> <span className="text-amber-600 font-bold">Reserved</span></p>
          </div>

          <div className="pt-4 flex justify-center gap-3 font-mono text-xs">
            <button
              onClick={() => {
                setStep(1);
                setConfirmedReservation(null);
              }}
              className="px-4 py-2 border border-acc-300 rounded hover:bg-acc-100"
            >
              Book Another Room
            </button>
            <button
              onClick={() => window.location.href = '/reservations'}
              className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold rounded"
            >
              View All Reservations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
