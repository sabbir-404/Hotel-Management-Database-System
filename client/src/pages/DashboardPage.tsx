import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { 
  Buildings, 
  Bed, 
  CheckCircle, 
  Door, 
  Users, 
  CalendarCheck, 
  CurrencyDollar, 
  TrendUp,
  ChartPieSlice,
  ArrowClockwise
} from '@phosphor-icons/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<{ summary: DashboardSummary; charts: any } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-xs text-acc-500">
        Loading real-time hotel metrics from XAMPP MySQL...
      </div>
    );
  }

  const summary = data?.summary;
  const roomTypeData = data?.charts?.roomTypeDist || [];
  const revenueData = data?.charts?.revenueByMonth || [];

  const COLORS = ['#2018b4', '#78ad52', '#d6bf29', '#808080'];

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Executive Overview Dashboard
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            Live database stats & metrics overview
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-acc-300 dark:border-acc-700 bg-white dark:bg-acc-900 text-xs font-mono rounded hover:bg-acc-100 transition-colors"
        >
          <ArrowClockwise size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hotels */}
        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Total Hotels</p>
            <h3 className="text-2xl font-bold font-mono text-acc-950 dark:text-acc-50 mt-1">{summary?.totalHotels || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-acc-100 dark:bg-acc-800 flex items-center justify-center text-acc-700 dark:text-acc-200">
            <Buildings size={20} />
          </div>
        </div>

        {/* Total Rooms */}
        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Total Rooms</p>
            <h3 className="text-2xl font-bold font-mono text-acc-950 dark:text-acc-50 mt-1">{summary?.totalRooms || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-acc-100 dark:bg-acc-800 flex items-center justify-center text-acc-700 dark:text-acc-200">
            <Bed size={20} />
          </div>
        </div>

        {/* Available Rooms */}
        <div className="panel-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Available Rooms</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">{summary?.availableRooms || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Occupied Rooms */}
        <div className="panel-card p-4 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Occupied Rooms</p>
            <h3 className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-1">{summary?.occupiedRooms || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <Door size={20} />
          </div>
        </div>

        {/* Guests Today */}
        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Guests In House Today</p>
            <h3 className="text-2xl font-bold font-mono text-acc-950 dark:text-acc-50 mt-1">{summary?.guestsToday || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-acc-100 dark:bg-acc-800 flex items-center justify-center text-acc-700 dark:text-acc-200">
            <Users size={20} />
          </div>
        </div>

        {/* Active Reservations */}
        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Active Bookings</p>
            <h3 className="text-2xl font-bold font-mono text-acc-950 dark:text-acc-50 mt-1">{summary?.activeReservations || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-acc-100 dark:bg-acc-800 flex items-center justify-center text-acc-700 dark:text-acc-200">
            <CalendarCheck size={20} />
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Today's Revenue</p>
            <h3 className="text-2xl font-bold font-mono text-acc-950 dark:text-acc-50 mt-1">
              ৳{Number(summary?.todayRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-10 h-10 rounded bg-acc-100 dark:bg-acc-800 flex items-center justify-center text-acc-700 dark:text-acc-200">
            <CurrencyDollar size={20} />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="panel-card p-4 flex items-center justify-between border-l-4 border-l-brand-500">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-acc-500">Monthly Revenue</p>
            <h3 className="text-2xl font-bold font-mono text-acc-950 dark:text-acc-50 mt-1">
              ৳{Number(summary?.monthlyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-10 h-10 rounded bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <TrendUp size={20} />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Growth Bar Chart */}
        <div className="panel-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-acc-100 dark:border-acc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-acc-950 dark:text-acc-50">Monthly Revenue Breakdown</h3>
              <p className="text-[11px] font-mono text-acc-500">Historical earnings across periods</p>
            </div>
            <span className="badge-pill bg-sec-100 text-sec-800 dark:bg-sec-900 dark:text-sec-200 font-mono">
              Total Recorded: ৳{Number(summary?.monthlyRevenue || 0).toLocaleString()}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData.length > 0 ? revenueData : [{ Month: 'Current', Revenue: summary?.monthlyRevenue || 2000 }]}>
                <XAxis dataKey="Month" stroke="#808080" fontSize={11} />
                <YAxis stroke="#808080" fontSize={11} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '4px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="Revenue" fill="#2018b4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Rate & Room Types Distribution */}
        <div className="panel-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-acc-100 dark:border-acc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-acc-950 dark:text-acc-50">Occupancy Rate</h3>
                <p className="text-[11px] font-mono text-acc-500">Occupied vs Available capacity</p>
              </div>
              <span className="text-lg font-bold font-mono text-acc-950 dark:text-acc-50">
                {summary?.occupancyRate}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-acc-200 dark:bg-acc-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-brand-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${summary?.occupancyRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Room Type Pie Chart */}
          <div className="pt-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-acc-500 mb-2">Room Type Breakdown</h4>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="Count"
                    nameKey="Room_Type"
                  >
                    {roomTypeData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '4px', fontSize: '11px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
