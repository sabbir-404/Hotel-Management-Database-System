import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Hotel } from '../types';
import { 
  Bed, 
  CalendarBlank, 
  MapPin, 
  ArrowRight,
  CheckCircle,
  Warning
} from '@phosphor-icons/react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dbRegions, setDbRegions] = useState<string[]>(['Dhaka', 'Cox\'s Bazar', 'Sylhet']);
  const [selectedRegion, setSelectedRegion] = useState<string>('Dhaka');
  const [checkIn, setCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

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

      {/* Your upcoming trip section */}
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

    </div>
  );
};
