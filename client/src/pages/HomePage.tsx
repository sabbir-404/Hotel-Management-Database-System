import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Hotel } from '../types';
import { 
  CalendarBlank, 
  MapPin, 
  ArrowRight,
  FacebookLogo,
  TwitterLogo,
  LinkedinLogo,
  Globe
} from '@phosphor-icons/react';

interface TeamMember {
  id: number;
  name: string;
  image: string;
}

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dbRegions, setDbRegions] = useState<string[]>(['Dhaka', 'Cox\'s Bazar', 'Sylhet']);
  const [selectedRegion, setSelectedRegion] = useState<string>('Dhaka');
  const [checkIn, setCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

  // 6 Team Members list with placeholder profile images and empty description boxes
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Team Member 1',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 2,
      name: 'Team Member 2',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 3,
      name: 'Team Member 3',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 4,
      name: 'Team Member 4',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 5,
      name: 'Team Member 5',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    {
      id: 6,
      name: 'Team Member 6',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80'
    }
  ];

  useEffect(() => {
    const fetchHotelRegions = async () => {
      try {
        const res = await api.get('/hotels');
        if (res.data && Array.isArray(res.data)) {
          const cities = Array.from(new Set(res.data.map((h: Hotel) => h.City).filter(Boolean))) as string[];
          if (cities.length > 0) {
            setDbRegions(cities);
            setSelectedRegion(cities[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load database hotel regions', err);
      }
    };
    fetchHotelRegions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/hotels?destination=${encodeURIComponent(selectedRegion)}&checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  return (
    <div className="space-y-8 pb-12 page-fade-enter max-w-5xl mx-auto">
      
      {/* Top Banner Hero Header (Booking.com style without category tabs) */}
      <div className="rounded-xl overflow-hidden bg-brand-900 dark:bg-acc-900 text-white p-6 md:p-10 space-y-6 shadow-md border border-brand-800 dark:border-acc-800">
        
        {/* Greeting Headline & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Where to next, {user?.name ? user.name.split(' ')[0] : 'Guest'}?
          </h1>
          <p className="text-acc-200 text-xs md:text-sm font-sans">
            Find exclusive rewards and luxury stays across verified hotel regions in Bangladesh!
          </p>
        </div>

        {/* Search Bar Container: Region Dropdown + Check-in/out Dates + Search CTA */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-amber-400 p-1 rounded-xl shadow-lg border-2 border-amber-500 text-acc-950"
        >
          <div className="bg-white dark:bg-acc-900 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-1 p-1 items-center">
            
            {/* 1. Region / City Dropdown (Database Hotel Regions) */}
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

            {/* 2. Select Dates */}
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

            {/* 3. Search CTA Button */}
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

      {/* Featured Hotel Regions */}
      <div className="space-y-3">
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

      {/* About Us / Team Members Section (Formal & Eye-Soothing Redesign) */}
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
                  Software Engineer
                </p>
              </div>

              {/* Empty Description Box */}
              <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded-xl border border-dashed border-acc-200 dark:border-acc-750 min-h-[56px] flex items-center justify-center">
                <span className="text-[10px] text-acc-400 font-mono italic">
                  {/* Reserved space for member bio description */}
                </span>
              </div>

              {/* Social Link Icon Circle Buttons */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-7 h-7 rounded-full bg-acc-100 dark:bg-acc-800 text-acc-600 dark:text-acc-300 hover:bg-brand-500 hover:text-acc-950 transition-colors flex items-center justify-center text-xs"
                  title="Facebook"
                >
                  <FacebookLogo size={14} />
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-7 h-7 rounded-full bg-acc-100 dark:bg-acc-800 text-acc-600 dark:text-acc-300 hover:bg-brand-500 hover:text-acc-950 transition-colors flex items-center justify-center text-xs"
                  title="Twitter"
                >
                  <TwitterLogo size={14} />
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-7 h-7 rounded-full bg-acc-100 dark:bg-acc-800 text-acc-600 dark:text-acc-300 hover:bg-brand-500 hover:text-acc-950 transition-colors flex items-center justify-center text-xs"
                  title="LinkedIn"
                >
                  <LinkedinLogo size={14} />
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-7 h-7 rounded-full bg-acc-100 dark:bg-acc-800 text-acc-600 dark:text-acc-300 hover:bg-brand-500 hover:text-acc-950 transition-colors flex items-center justify-center text-xs"
                  title="Website"
                >
                  <Globe size={14} />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
