import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Reservation, Guest, Room, Hotel } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarPlus, 
  CheckCircle, 
  SignOut, 
  XCircle, 
  Trash, 
  MagnifyingGlass, 
  Calculator,
  Bed
} from '@phosphor-icons/react';

export const ReservationsPage: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Booking Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Guest_ID: 1,
    Hotel_ID: 1,
    Room_ID: 1,
    Check_In_Date: new Date().toISOString().split('T')[0],
    Check_Out_Date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    Number_of_Guests: 2
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, guestData, roomData, hotelData] = await Promise.all([
        api.get('/reservations'),
        api.get('/guests'),
        api.get('/rooms'),
        api.get('/hotels')
      ]);
      setReservations(resData.data);
      setGuests(guestData.data);
      setRooms(roomData.data);
      setHotels(hotelData.data);

      if (guestData.data.length > 0) {
        setFormData(prev => ({ ...prev, Guest_ID: guestData.data[0].Guest_ID }));
      }
      if (roomData.data.length > 0) {
        const avail = roomData.data.find((r: Room) => r.Availability_Status === 'Available');
        if (avail) {
          setFormData(prev => ({ ...prev, Room_ID: avail.Room_ID, Hotel_ID: avail.Hotel_ID }));
        }
      }
    } catch (err) {
      console.error('Failed to load reservation dataset', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute total nights and room charges automatically
  const selectedRoom = rooms.find(r => r.Room_ID === formData.Room_ID);
  const checkInDate = new Date(formData.Check_In_Date);
  const checkOutDate = new Date(formData.Check_Out_Date);
  const calculatedNights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
  const calculatedCharge = selectedRoom ? Number(selectedRoom.Nightly_Rate) * calculatedNights : 0;

  const availableRoomsForHotel = rooms.filter(r => 
    r.Hotel_ID === formData.Hotel_ID && r.Availability_Status === 'Available'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reservations', {
        Guest_ID: formData.Guest_ID,
        Room_ID: formData.Room_ID,
        Check_In_Date: formData.Check_In_Date,
        Check_Out_Date: formData.Check_Out_Date,
        Number_of_Guests: formData.Number_of_Guests
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Reservation Creation Failed');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/reservations/${id}`, { Reservation_Status: status });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update reservation status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Cancel & delete reservation? (Backs up to Reservation_Log automatically)')) return;
    try {
      await api.delete(`/reservations/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete reservation');
    }
  };

  const filteredReservations = reservations.filter(r => {
    const nameMatch = `${r.First_Name || ''} ${r.Last_Name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
                      (r.Room_Number && r.Room_Number.toLowerCase().includes(search.toLowerCase()));
    const statusMatch = !statusFilter || r.Reservation_Status === statusFilter;
    return nameMatch && statusMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      case 'Checked In':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Checked Out':
        return 'bg-acc-100 text-acc-800 border-acc-300 dark:bg-acc-800 dark:text-acc-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-acc-100 text-acc-800';
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Receptionist';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Room Reservations & Bookings
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            Automated Availability Checks & Trigger Backups
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-semibold text-xs rounded transition-colors"
          >
            <CalendarPlus size={16} />
            <span>Create Reservation</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="panel-card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reservation by guest name or room number..."
            className="w-full pl-9 pr-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs focus:outline-none font-mono"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs font-mono"
        >
          <option value="">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked In">Checked In</option>
          <option value="Checked Out">Checked Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Reservations Table */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
              <tr>
                <th className="p-3 font-semibold">Res #</th>
                <th className="p-3 font-semibold">Guest</th>
                <th className="p-3 font-semibold">Room & Hotel</th>
                <th className="p-3 font-semibold">Check In / Out</th>
                <th className="p-3 font-semibold text-center">Nights</th>
                <th className="p-3 font-semibold">Est. Charge</th>
                <th className="p-3 font-semibold">Status</th>
                {canEdit && <th className="p-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-acc-500">Loading reservation ledger...</td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-acc-500">No active or historical reservations found.</td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr key={r.Reservation_ID} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">#RES-{r.Reservation_ID}</td>
                    <td className="p-3 font-sans font-semibold text-acc-950 dark:text-acc-100">
                      {r.First_Name} {r.Last_Name}
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-acc-900 dark:text-acc-100">Room {r.Room_Number} ({r.Room_Type})</div>
                      <div className="text-[10px] text-acc-500">{r.Hotel_Name}</div>
                    </td>
                    <td className="p-3">
                      <div>In: {new Date(r.Check_In_Date).toLocaleDateString()}</div>
                      <div>Out: {new Date(r.Check_Out_Date).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3 text-center font-bold">{r.Total_Nights || 1} Nights</td>
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">
                      ৳{Number(r.Room_Charge || 0).toLocaleString('en-US')}
                    </td>
                    <td className="p-3">
                      <span className={`badge-pill border ${getStatusBadge(r.Reservation_Status)}`}>
                        {r.Reservation_Status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.Reservation_Status === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(r.Reservation_ID, 'Checked In')}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-mono flex items-center gap-1"
                              title="Check In Guest"
                            >
                              <CheckCircle size={12} />
                              <span>Check In</span>
                            </button>
                          )}
                          {r.Reservation_Status === 'Checked In' && (
                            <button
                              onClick={() => handleUpdateStatus(r.Reservation_ID, 'Checked Out')}
                              className="px-2 py-1 bg-acc-900 dark:bg-brand-500 text-white dark:text-acc-950 rounded text-[10px] font-mono flex items-center gap-1"
                              title="Check Out Guest"
                            >
                              <SignOut size={12} />
                              <span>Check Out</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.Reservation_ID)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-red-600 dark:text-red-400"
                            title="Cancel & Backup Reservation"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
              Book Room Reservation
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Select Guest *</label>
                <select
                  value={formData.Guest_ID}
                  onChange={(e) => setFormData({ ...formData, Guest_ID: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                >
                  {guests.map(g => (
                    <option key={g.Guest_ID} value={g.Guest_ID}>
                      {g.First_Name} {g.Last_Name} ({g.Identification_Number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Filter Hotel *</label>
                  <select
                    value={formData.Hotel_ID}
                    onChange={(e) => {
                      const hId = parseInt(e.target.value);
                      const firstAvail = rooms.find(r => r.Hotel_ID === hId && r.Availability_Status === 'Available');
                      setFormData({ 
                        ...formData, 
                        Hotel_ID: hId,
                        Room_ID: firstAvail ? firstAvail.Room_ID : formData.Room_ID
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  >
                    {hotels.map(h => (
                      <option key={h.Hotel_ID} value={h.Hotel_ID}>{h.Hotel_Name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Select Available Room *</label>
                  <select
                    value={formData.Room_ID}
                    onChange={(e) => setFormData({ ...formData, Room_ID: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  >
                    {availableRoomsForHotel.length === 0 ? (
                      <option value="">No rooms available for this hotel</option>
                    ) : (
                      availableRoomsForHotel.map(r => (
                        <option key={r.Room_ID} value={r.Room_ID}>
                          Room {r.Room_Number} - {r.Room_Type} (${r.Nightly_Rate}/night)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Check In Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.Check_In_Date}
                    onChange={(e) => setFormData({ ...formData, Check_In_Date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Check Out Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.Check_Out_Date}
                    onChange={(e) => setFormData({ ...formData, Check_Out_Date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.Number_of_Guests}
                  onChange={(e) => setFormData({ ...formData, Number_of_Guests: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                />
              </div>

              {/* Realtime Automated Pricing Calculator */}
              <div className="p-3 bg-acc-50 dark:bg-acc-800 rounded border border-acc-200 dark:border-acc-700 space-y-1 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-acc-950 dark:text-acc-100 font-bold mb-1">
                  <Calculator size={16} />
                  <span>Automated Booking Calculation</span>
                </div>
                <div className="flex justify-between text-acc-600 dark:text-acc-300">
                  <span>Nightly Rate:</span>
                  <span>${selectedRoom ? Number(selectedRoom.Nightly_Rate).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-acc-600 dark:text-acc-300">
                  <span>Duration:</span>
                  <span>{calculatedNights} Night(s)</span>
                </div>
                <div className="flex justify-between text-acc-950 dark:text-acc-50 font-bold pt-1 border-t border-acc-200 dark:border-acc-700">
                  <span>Calculated Room Charge:</span>
                  <span>${calculatedCharge.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100 dark:border-acc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-acc-300 dark:border-acc-700 text-xs rounded hover:bg-acc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableRoomsForHotel.length === 0}
                  className="px-4 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs rounded disabled:opacity-50"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
