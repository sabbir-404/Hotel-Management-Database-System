import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Hotel, Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { HotelCardSkeleton } from '../components/SkeletonLoader';
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  Star, 
  Bed, 
  MapPin, 
  ArrowRight,
  CircleNotch,
  Image as ImageIcon
} from '@phosphor-icons/react';

export const HotelsPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotels, setHotels] = useState<(Hotel & { rooms?: Room[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<number | null>(null);

  const initialDestination = searchParams.get('destination') || '';
  const [search, setSearch] = useState(initialDestination);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [savingHotel, setSavingHotel] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({
    Hotel_Name: '',
    Address: '',
    City: 'Dhaka',
    Contact_Number: '',
    Star_Rating: 5,
    Image_Url: ''
  });

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels');
      const hotelList = res.data;

      // Fetch rooms for each hotel to display real Sale Rates and Room Descriptions
      const hotelsWithRooms = await Promise.all(
        hotelList.map(async (h: Hotel) => {
          try {
            const hRes = await api.get(`/hotels/${h.Hotel_ID}`);
            return { ...h, rooms: hRes.data.rooms || [] };
          } catch (e) {
            return { ...h, rooms: [] };
          }
        })
      );

      setHotels(hotelsWithRooms);
    } catch (err) {
      console.error('Failed to fetch hotels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const openCreateModal = () => {
    setEditingHotel(null);
    setFormData({
      Hotel_Name: '',
      Address: '',
      City: 'Dhaka',
      Contact_Number: '',
      Star_Rating: 5,
      Image_Url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    });
    setModalOpen(true);
  };

  const openEditModal = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      Hotel_Name: hotel.Hotel_Name,
      Address: hotel.Address || '',
      City: hotel.City || 'Dhaka',
      Contact_Number: hotel.Contact_Number || '',
      Star_Rating: hotel.Star_Rating || 5,
      Image_Url: hotel.Image_Url || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHotel(true);
    try {
      if (editingHotel) {
        await api.put(`/hotels/${editingHotel.Hotel_ID}`, formData);
      } else {
        await api.post('/hotels', formData);
      }
      setModalOpen(false);
      fetchHotels();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save hotel');
    } finally {
      setSavingHotel(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;
    try {
      await api.delete(`/hotels/${id}`);
      fetchHotels();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete hotel');
    }
  };

  const handleBookClick = (hotelId: number) => {
    setBtnLoading(hotelId);
    setTimeout(() => {
      if (!token) {
        navigate(`/register?hotelId=${hotelId}`);
      } else {
        navigate(`/reservations/new?hotelId=${hotelId}`);
      }
      setBtnLoading(null);
    }, 300);
  };

  const filteredHotels = hotels.filter(h => {
    return !search || search === 'All' ||
           h.Hotel_Name.toLowerCase().includes(search.toLowerCase()) ||
           (h.City && h.City.toLowerCase().includes(search.toLowerCase()));
  });

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  const defaultPresets = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
  ];

  return (
    <div className="space-y-6 page-fade-enter max-w-5xl mx-auto">
      
      {/* Top Header & Region Search Bar */}
      <div className="bg-amber-400 p-1 rounded-xl shadow-md border-2 border-amber-500">
        <div className="bg-white dark:bg-acc-900 rounded-lg p-2 flex flex-col md:flex-row items-center gap-3">
          
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 border border-acc-200 dark:border-acc-700 rounded text-xs">
            <Bed size={16} className="text-acc-400" />
            <select
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchParams(e.target.value ? { destination: e.target.value } : {});
              }}
              className="w-full bg-transparent font-bold focus:outline-none font-mono text-acc-950 dark:text-acc-50"
            >
              <option value="">All Regions (Show All 3 Hotels)</option>
              <option value="Dhaka">Dhaka Region</option>
              <option value="Cox's Bazar">Cox's Bazar Region</option>
              <option value="Sylhet">Sylhet Region</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 border border-acc-200 dark:border-acc-700 rounded text-xs font-mono">
            <span>Fri, Aug 7 — Sun, Aug 9</span>
          </div>

          <button
            onClick={fetchHotels}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded shadow transition-all flex items-center gap-1 active:scale-95"
          >
            {loading ? <CircleNotch size={14} className="animate-spin" /> : null}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Property Cards Container (Full Width, No Filter Sidebar) */}
      <div className="space-y-4">
        
        {/* Results Summary Bar */}
        <div className="flex justify-between items-center font-mono text-xs">
          <div>
            <h2 className="font-bold text-sm text-acc-950 dark:text-acc-50 font-sans">
              {search ? `${search}:` : 'All Locations:'} {filteredHotels.length} properties found
            </h2>
          </div>
          {canEdit && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-bold text-xs rounded shadow hover:opacity-90 transition-all"
            >
              <Plus size={14} />
              <span>Add Hotel</span>
            </button>
          )}
        </div>

        {/* Hotel Property Cards List */}
        {loading ? (
          <div className="space-y-4">
            <HotelCardSkeleton />
            <HotelCardSkeleton />
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="panel-card p-8 text-center text-xs font-mono text-acc-500 space-y-2">
            <p>No properties match your filter criteria.</p>
            <button onClick={() => setSearch('')} className="text-brand-500 underline font-bold">
              Show All Hotels
            </button>
          </div>
        ) : (
          filteredHotels.map((h, idx) => {
            const firstRoom = h.rooms && h.rooms.length > 0 ? h.rooms[0] : null;
            const originalRate = firstRoom ? Number(firstRoom.Nightly_Rate) : (h.Hotel_ID === 1 ? 4500 : h.Hotel_ID === 2 ? 7000 : 5000);
            const saleRate = firstRoom && firstRoom.Sale_Rate ? Number(firstRoom.Sale_Rate) : (originalRate * 0.8);
            const imgUrl = h.Image_Url || defaultPresets[idx % defaultPresets.length];
            const roomDesc = firstRoom?.Room_Description || `${firstRoom?.Room_Type || 'Deluxe King'} Room • Air conditioning • King bed • Breakfast included`;

            return (
              <div
                key={h.Hotel_ID}
                className="panel-card p-4 flex flex-col md:flex-row gap-4 border border-acc-200 dark:border-acc-800 hover:border-brand-500 transition-all shadow-sm group page-fade-enter"
              >
                {/* Left Hotel Photo Thumbnail */}
                <div className="w-full md:w-60 h-48 rounded overflow-hidden shrink-0 relative bg-acc-100 dark:bg-acc-800">
                  <img
                    src={imgUrl}
                    alt={h.Hotel_Name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono font-bold">
                    {h.City || 'Bangladesh'}
                  </span>
                </div>

                {/* Right Content & Pricing Info */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  
                  {/* Top Row: Title & Star Rating (No Genius Badge, No Dummy Review Score) */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-acc-950 dark:text-acc-50 group-hover:text-brand-500 transition-colors">
                          {h.Hotel_Name}
                        </h3>
                        <div className="flex text-amber-500">
                          {Array.from({ length: h.Star_Rating || 5 }).map((_, i) => (
                            <Star key={i} size={12} weight="fill" />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-acc-500 font-mono mt-1">
                        <MapPin size={13} className="text-brand-500" />
                        <span className="font-semibold text-acc-800 dark:text-acc-200">{h.City}</span>
                        <span>• {h.Address || 'Central Location'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Description Box (Fetched Directly from Database) */}
                  <div className="text-xs p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800/80 font-sans space-y-1">
                    <div className="font-bold text-acc-950 dark:text-acc-100 flex justify-between items-center">
                      <span>{firstRoom ? `${firstRoom.Room_Type} Room #${firstRoom.Room_Number}` : 'Standard Deluxe Room'}</span>
                      {firstRoom && (
                        <span className="text-[10px] font-mono text-acc-500">Capacity: {firstRoom.Capacity} Guests</span>
                      )}
                    </div>
                    <div className="text-xs text-acc-700 dark:text-acc-300 leading-relaxed font-mono">
                      {roomDesc}
                    </div>
                  </div>

                  {/* Bottom Pricing & CTA Row (Shows Crossed-Out Regular Price & Active Sale Price) */}
                  <div className="flex justify-between items-end pt-2 border-t border-acc-100 dark:border-acc-800">
                    <div className="text-[11px] text-acc-500 font-mono">
                      {h.Total_Rooms || 4} Rooms Listed | Contact: {h.Contact_Number || '+880-1711-001122'}
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-[10px] text-acc-500 font-mono">2 nights stay</div>
                      
                      {/* Crossed-out original price & BDT sale price from database */}
                      {originalRate > saleRate && (
                        <div className="text-xs text-red-500 line-through font-mono font-semibold">
                          BDT {(originalRate * 2).toLocaleString()}
                        </div>
                      )}

                      <div className="text-lg font-extrabold font-mono text-acc-950 dark:text-acc-50">
                        BDT {(saleRate * 2).toLocaleString()}
                      </div>
                      
                      <div className="text-[9px] text-acc-400 font-mono">+ BDT {((saleRate * 2) * 0.1).toLocaleString()} taxes</div>

                      <div className="pt-2 flex justify-end gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(h)}
                            className="p-1.5 border border-acc-300 rounded text-xs hover:bg-acc-100"
                            title="Edit Hotel"
                          >
                            <PencilSimple size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleBookClick(h.Hotel_ID)}
                          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded shadow flex items-center gap-1 font-mono active:scale-95 transition-transform"
                        >
                          {btnLoading === h.Hotel_ID ? (
                            <CircleNotch size={14} className="animate-spin" />
                          ) : null}
                          <span>Check prices</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create Hotel Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 pb-2">
              {editingHotel ? 'Edit Hotel Details' : 'Add New Hotel Branch'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Hotel Branch Name *</label>
                <input
                  type="text"
                  required
                  value={formData.Hotel_Name}
                  onChange={(e) => setFormData({ ...formData, Hotel_Name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    value={formData.City}
                    onChange={(e) => setFormData({ ...formData, City: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Star Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.Star_Rating}
                    onChange={(e) => setFormData({ ...formData, Star_Rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={formData.Contact_Number}
                  onChange={(e) => setFormData({ ...formData, Contact_Number: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                  <ImageIcon size={14} />
                  <span>Hotel Picture URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.Image_Url}
                  onChange={(e) => setFormData({ ...formData, Image_Url: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 border border-acc-300 rounded text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 border text-xs rounded">Cancel</button>
                <button
                  type="submit"
                  disabled={savingHotel}
                  className="px-4 py-1.5 bg-acc-950 text-white font-bold text-xs rounded flex items-center gap-1"
                >
                  {savingHotel ? <CircleNotch size={14} className="animate-spin" /> : null}
                  <span>Save Hotel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
