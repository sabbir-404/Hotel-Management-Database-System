import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Room, Hotel } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, PencilSimple, Trash, MagnifyingGlass, CircleNotch } from '@phosphor-icons/react';

export const RoomsPage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    Hotel_ID: 1,
    Room_Number: '',
    Room_Type: 'Single' as Room['Room_Type'],
    Floor_Number: 1,
    Capacity: 2,
    Nightly_Rate: 4500.00,
    Sale_Rate: 3500.00,
    Room_Description: '',
    Availability_Status: 'Available' as Room['Availability_Status']
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, hotelsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/hotels')
      ]);
      setRooms(roomsRes.data);
      setHotels(hotelsRes.data);
      if (hotelsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, Hotel_ID: hotelsRes.data[0].Hotel_ID }));
      }
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      Hotel_ID: hotels[0]?.Hotel_ID || 1,
      Room_Number: '',
      Room_Type: 'Single',
      Floor_Number: 1,
      Capacity: 2,
      Nightly_Rate: 4500.00,
      Sale_Rate: 3500.00,
      Room_Description: 'Single Deluxe Room • Air conditioning • King bed • Breakfast included • Free cancellation',
      Availability_Status: 'Available'
    });
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      Hotel_ID: room.Hotel_ID,
      Room_Number: room.Room_Number,
      Room_Type: room.Room_Type,
      Floor_Number: room.Floor_Number,
      Capacity: room.Capacity,
      Nightly_Rate: Number(room.Nightly_Rate),
      Sale_Rate: room.Sale_Rate ? Number(room.Sale_Rate) : Number(room.Nightly_Rate) * 0.8,
      Room_Description: room.Room_Description || '',
      Availability_Status: room.Availability_Status
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.Room_ID}`, formData);
      } else {
        await api.post('/rooms', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.Room_Number.toLowerCase().includes(search.toLowerCase()) ||
                          (r.Hotel_Name && r.Hotel_Name.toLowerCase().includes(search.toLowerCase()));
    const matchesType = !typeFilter || r.Room_Type === typeFilter;
    const matchesStatus = !statusFilter || r.Availability_Status === statusFilter;
    const matchesHotel = !hotelFilter || r.Hotel_ID === parseInt(hotelFilter);

    return matchesSearch && matchesType && matchesStatus && matchesHotel;
  });

  const getStatusBadge = (status: Room['Availability_Status']) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'Reserved':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'Occupied':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300';
      case 'Maintenance':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300';
      default:
        return 'bg-acc-100 text-acc-800';
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Receptionist';

  return (
    <div className="space-y-6 page-fade-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Room Inventory Management
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            MySQL Table: <code>Room</code> (Linked to Hotel Branch)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3 py-2 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-semibold text-xs rounded transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Add New Room</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="panel-card p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room number..."
            className="w-full pl-9 pr-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs focus:outline-none font-mono"
          />
        </div>

        {/* Hotel Filter */}
        <select
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
          className="px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs font-mono"
        >
          <option value="">All Hotels</option>
          {hotels.map(h => (
            <option key={h.Hotel_ID} value={h.Hotel_ID}>{h.Hotel_Name}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs font-mono"
        >
          <option value="">All Room Types</option>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Suite">Suite</option>
          <option value="Deluxe">Deluxe</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs font-mono"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Rooms Table */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
              <tr>
                <th className="p-3 font-semibold">Room #</th>
                <th className="p-3 font-semibold">Hotel</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Floor</th>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 font-semibold">Regular Price</th>
                <th className="p-3 font-semibold">Discount / Sale Price</th>
                <th className="p-3 font-semibold">Status</th>
                {canEdit && <th className="p-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-acc-500">Loading room inventory...</td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-acc-500">No rooms matching filter criteria.</td>
                </tr>
              ) : (
                filteredRooms.map((r) => (
                  <tr key={r.Room_ID} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">Room {r.Room_Number}</td>
                    <td className="p-3 font-sans font-medium">{r.Hotel_Name}</td>
                    <td className="p-3">{r.Room_Type}</td>
                    <td className="p-3">Floor {r.Floor_Number}</td>
                    <td className="p-3 max-w-xs truncate text-[11px] text-acc-500" title={r.Room_Description}>
                      {r.Room_Description || 'No description'}
                    </td>
                    <td className="p-3 font-bold text-red-500 line-through">
                      ৳{Number(r.Nightly_Rate).toLocaleString('en-US')}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ৳{r.Sale_Rate ? Number(r.Sale_Rate).toLocaleString('en-US') : Number(r.Nightly_Rate).toLocaleString('en-US')}
                    </td>
                    <td className="p-3">
                      <span className={`badge-pill border ${getStatusBadge(r.Availability_Status)}`}>
                        {r.Availability_Status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 hover:bg-acc-200 dark:hover:bg-acc-700 rounded text-acc-700 dark:text-acc-300"
                            title="Edit Room"
                          >
                            <PencilSimple size={15} />
                          </button>
                          {user?.role === 'Admin' && (
                            <button
                              onClick={() => handleDelete(r.Room_ID)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-red-600 dark:text-red-400"
                              title="Delete Room"
                            >
                              <Trash size={15} />
                            </button>
                          )}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
              {editingRoom ? `Edit Room ${editingRoom.Room_Number}` : 'Add New Room'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Hotel Branch *</label>
                <select
                  value={formData.Hotel_ID}
                  onChange={(e) => setFormData({ ...formData, Hotel_ID: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                >
                  {hotels.map(h => (
                    <option key={h.Hotel_ID} value={h.Hotel_ID}>{h.Hotel_Name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.Room_Number}
                    onChange={(e) => setFormData({ ...formData, Room_Number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Room Type *</label>
                  <select
                    value={formData.Room_Type}
                    onChange={(e) => setFormData({ ...formData, Room_Type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Suite">Suite</option>
                    <option value="Deluxe">Deluxe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Floor Number</label>
                  <input
                    type="number"
                    value={formData.Floor_Number}
                    onChange={(e) => setFormData({ ...formData, Floor_Number: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Capacity (Guests)</label>
                  <input
                    type="number"
                    value={formData.Capacity}
                    onChange={(e) => setFormData({ ...formData, Capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Pricing: Regular Price + Sale / Discount Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Regular Rate (BDT ৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.Nightly_Rate}
                    onChange={(e) => setFormData({ ...formData, Nightly_Rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Sale / Discount Rate (BDT ৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.Sale_Rate}
                    onChange={(e) => setFormData({ ...formData, Sale_Rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono text-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* Room Description Text Area */}
              <div>
                <label className="block text-xs font-medium mb-1">Room Description (Amenities & Features)</label>
                <textarea
                  rows={2}
                  value={formData.Room_Description}
                  onChange={(e) => setFormData({ ...formData, Room_Description: e.target.value })}
                  placeholder="e.g. Deluxe King Room • Air conditioning • King bed • Breakfast included • Free cancellation"
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Availability Status</label>
                <select
                  value={formData.Availability_Status}
                  onChange={(e) => setFormData({ ...formData, Availability_Status: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
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
                  disabled={submitting}
                  className="px-4 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs rounded flex items-center gap-1"
                >
                  {submitting ? <CircleNotch size={14} className="animate-spin" /> : null}
                  <span>Save Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
