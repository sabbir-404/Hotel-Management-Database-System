import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Hotel } from '../types';
import { 
  CalendarBlank, 
  MapPin, 
  ArrowRight,
  Buildings,
  Star,
  Eye,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  description: string;
}

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [dbRegions, setDbRegions] = useState<string[]>(['Dhaka', 'Cox\'s Bazar', 'Sylhet', 'Chittagong', 'Rangamati', 'Sreemangal']);
  const [selectedRegion, setSelectedRegion] = useState<string>('Dhaka');
  const [checkIn, setCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

  // Carousel Slider State
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // 6 Team Members list (Update names, roles, image URLs, and descriptions directly here in code)
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Team Member 1',
      role: 'Software Engineer',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      description: ''
    },
    {
      id: 2,
      name: 'Team Member 2',
      role: 'Software Engineer',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      description: ''
    },
    {
      id: 3,
      name: 'Team Member 3',
      role: 'Software Engineer',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      description: ''
    },
    {
      id: 4,
      name: 'Team Member 4',
      role: 'Software Engineer',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      description: ''
    },
    {
      id: 5,
      name: 'Team Member 5',
      role: 'Software Engineer',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      description: ''
    },
    {
      id: 6,
      name: 'Team Member 6',
      role: 'Software Engineer',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      description: ''
    }
  ];

  useEffect(() => {
    const fetchHotelsData = async () => {
      try {
        const res = await api.get('/hotels');
        if (res.data && Array.isArray(res.data)) {
          setHotels(res.data);
          const cities = Array.from(new Set(res.data.map((h: Hotel) => h.City).filter(Boolean))) as string[];
          if (cities.length > 0) {
            setDbRegions(cities);
            setSelectedRegion(cities[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load database hotels', err);
      }
    };
    fetchHotelsData();
  }, []);

  // Calculate max slides for carousel (assuming 3 visible per view)
  const itemsPerView = 3;
  const maxSlide = Math.max(0, hotels.length - itemsPerView);

  // Auto-slide effect every 3.5 seconds
  useEffect(() => {
    if (isHovered || hotels.length <= itemsPerView) return;

    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev >= maxSlide ? 0 : prev + 1));
    }, 3500);

    return () => clearInterval(timer);
  }, [hotels, maxSlide, isHovered]);

  const nextSlide = () => {
    setSlideIndex((prev) => (prev >= maxSlide ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev <= 0 ? maxSlide : prev - 1));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/hotels?destination=${encodeURIComponent(selectedRegion)}&checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  return (
    <div className="space-y-8 pb-12 page-fade-enter max-w-5xl mx-auto">
      
      {/* Top Banner Hero Header */}
      <div className="rounded-xl overflow-hidden bg-brand-900 dark:bg-acc-900 text-white p-6 md:p-10 space-y-6 shadow-md border border-brand-800 dark:border-acc-800">
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Where to next, {user?.name ? user.name.split(' ')[0] : 'Guest'}?
          </h1>
          <p className="text-acc-200 text-xs md:text-sm font-sans">
            Find exclusive rewards and luxury stays across verified hotel regions in Bangladesh!
          </p>
        </div>

        {/* Search Bar Container */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-amber-400 p-1 rounded-xl shadow-lg border-2 border-amber-500 text-acc-950"
        >
          <div className="bg-white dark:bg-acc-900 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-1 p-1 items-center">
            
            <div className="md:col-span-5 flex items-center gap-2 px-3 py-2 border-b md:border-b-0 md:border-r border-acc-200 dark:border-acc-700">
              <MapPin size={20} className="text-amber-600 shrink-0" />
              <div className="w-full">
                <label className="block text-[9px] uppercase font-mono tracking-wider text-acc-400 font-bold">
                  Hotel Region / Location
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-acc-950 dark:text-acc-50 focus:outline-none font-mono cursor-pointer"
                >
                  {dbRegions.map((region) => (
                    <option key={region} value={region} className="bg-white dark:bg-acc-900 text-acc-950 dark:text-acc-50 font-bold">
                      {region} Region
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-5 flex items-center gap-2 px-3 py-2 border-b md:border-b-0 md:border-r border-acc-200 dark:border-acc-700">
              <CalendarBlank size={20} className="text-acc-500 shrink-0" />
              <div className="w-full grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-wider text-acc-400 font-bold">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-acc-950 dark:text-acc-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-wider text-acc-400 font-bold">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-acc-950 dark:text-acc-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-1">
              <button
                type="submit"
                className="w-full h-11 bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded transition-colors flex items-center justify-center gap-1 shadow"
              >
                <span>Search</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </form>

      </div>

      {/* Trending Hotels Section with Auto-Sliding Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-acc-950 dark:text-acc-50 flex items-center gap-2">
              <Buildings size={18} className="text-brand-500" />
              <span>Trending Hotels ({hotels.length} Available)</span>
            </h2>
            <p className="text-xs text-acc-500 font-sans">
              Popular Bangladesh hotels currently available in our database
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/hotels"
              className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>

            {/* Manual Carousel Control Chevrons */}
            <div className="flex items-center gap-1">
              <button
                onClick={prevSlide}
                className="p-1.5 rounded-full border border-acc-200 dark:border-acc-700 bg-white dark:bg-acc-900 text-acc-800 dark:text-acc-200 hover:bg-brand-500 hover:text-acc-950 transition-colors shadow-xs"
                title="Previous Hotel Slide"
              >
                <CaretLeft size={14} />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 rounded-full border border-acc-200 dark:border-acc-700 bg-white dark:bg-acc-900 text-acc-800 dark:text-acc-200 hover:bg-brand-500 hover:text-acc-950 transition-colors shadow-xs"
                title="Next Hotel Slide"
              >
                <CaretRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Sliding Carousel Container */}
        <div 
          className="relative overflow-hidden py-1"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="flex transition-transform duration-500 ease-out gap-5"
            style={{ transform: `translateX(-${slideIndex * (100 / itemsPerView)}%)` }}
          >
            {hotels.map((hotel) => (
              <div
                key={hotel.Hotel_ID}
                className="w-full md:w-[calc(33.333%-13.33px)] shrink-0 bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Hotel Image */}
                <div className="relative h-44 overflow-hidden bg-acc-100 dark:bg-acc-800">
                  <img
                    src={hotel.Image_Url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={hotel.Hotel_Name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-acc-950/80 backdrop-blur-sm text-amber-400 px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border border-acc-700">
                    <Star size={12} weight="fill" />
                    <span>{hotel.Star_Rating || 5}-Star</span>
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-acc-950 dark:text-acc-50 group-hover:text-brand-500 transition-colors line-clamp-1">
                      {hotel.Hotel_Name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-acc-500 font-sans">
                      <MapPin size={14} className="text-amber-500 shrink-0" />
                      <span className="line-clamp-1">{hotel.Address ? `${hotel.Address}, ` : ''}{hotel.City}</span>
                    </div>
                  </div>

                  {/* View More Button */}
                  <div className="pt-2 border-t border-acc-100 dark:border-acc-800">
                    <button
                      onClick={() => navigate(`/hotels?destination=${encodeURIComponent(hotel.City)}`)}
                      className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-acc-950 font-extrabold text-xs rounded transition-all flex items-center justify-center gap-1.5 font-mono shadow-xs active:scale-95"
                    >
                      <Eye size={15} />
                      <span>View More</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex justify-center gap-1.5 pt-4">
            {Array.from({ length: maxSlide + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlideIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  slideIndex === idx ? 'w-6 bg-brand-500' : 'w-2 bg-acc-300 dark:bg-acc-700'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Hotel Regions */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-acc-500 font-semibold">
          Featured Hotel Regions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/hotels?destination=Dhaka')}
            className="panel-card p-4 space-y-2 hover:border-brand-500 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 group-hover:text-brand-500">Dhaka Region</h3>
              <span className="badge-pill bg-brand-100 text-brand-800 font-mono text-[9px]">Capital</span>
            </div>
            <p className="text-xs text-acc-500">Luxury city staycation, 5-star suites & executive lounges in Gulshan & Banani.</p>
          </div>

          <div
            onClick={() => navigate('/hotels?destination=Cox\'s Bazar')}
            className="panel-card p-4 space-y-2 hover:border-brand-500 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 group-hover:text-brand-500">Cox's Bazar Region</h3>
              <span className="badge-pill bg-emerald-100 text-emerald-800 font-mono text-[9px]">Beachfront</span>
            </div>
            <p className="text-xs text-acc-500">World's longest sea beach, beachfront resorts, infinity pools & ocean view balconies.</p>
          </div>

          <div
            onClick={() => navigate('/hotels?destination=Sylhet')}
            className="panel-card p-4 space-y-2 hover:border-brand-500 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 group-hover:text-brand-500">Sylhet Region</h3>
              <span className="badge-pill bg-indigo-100 text-indigo-800 font-mono text-[9px]">Nature</span>
            </div>
            <p className="text-xs text-acc-500">Peaceful tea gardens, hill view lodges & organic herbal spa treatments.</p>
          </div>
        </div>
      </div>

      {/* About Us / Team Members Section */}
      <div className="space-y-6 pt-8 border-t border-acc-200 dark:border-acc-800">
        
        {/* Centered Formal Section Header */}
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/15 border border-brand-500/30 rounded-full text-brand-600 dark:text-brand-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            <span>OUR TEAM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-acc-950 dark:text-acc-50">
            Team <span className="text-brand-500">Members</span>
          </h2>
          
          <p className="text-xs text-acc-500 font-sans leading-relaxed">
            The engineering and design minds behind Hotel.com Database Management System
          </p>
        </div>

        {/* 6 Team Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 text-center group hover:border-brand-500/60"
            >
              {/* Small Round Profile Picture Icon */}
              <div className="relative inline-block mx-auto">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-sm mx-auto group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Name & Title Banner Pill */}
              <div className="bg-brand-500 text-acc-950 py-2.5 px-3 rounded-xl font-sans shadow-xs">
                <h3 className="font-extrabold text-xs tracking-tight">
                  {member.name}
                </h3>
                <p className="text-[10px] font-mono font-medium opacity-85">
                  {member.role || 'Software Engineer'}
                </p>
              </div>

              {/* Description Box */}
              <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded-xl border border-dashed border-acc-200 dark:border-acc-750 min-h-[56px] flex items-center justify-center">
                <span className="text-[10px] text-acc-600 dark:text-acc-400 font-sans">
                  {member.description || ''}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
