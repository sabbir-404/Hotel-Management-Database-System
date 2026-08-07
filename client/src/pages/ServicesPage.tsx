import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Service, ServiceRecord, Guest } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, BellRinging, UserPlus, PencilSimple, Trash } from '@phosphor-icons/react';

export const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    Service_Name: '',
    Service_Charge: 25.00,
    Service_Description: ''
  });

  const [assignForm, setAssignForm] = useState({
    Guest_ID: 1,
    Service_ID: 1,
    Quantity: 1,
    Service_Date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, recRes, gstRes] = await Promise.all([
        api.get('/services'),
        api.get('/services/records'),
        api.get('/guests')
      ]);
      setServices(svcRes.data);
      setRecords(recRes.data);
      setGuests(gstRes.data);

      if (svcRes.data.length > 0) {
        setAssignForm(prev => ({ ...prev, Service_ID: svcRes.data[0].Service_ID }));
      }
      if (gstRes.data.length > 0) {
        setAssignForm(prev => ({ ...prev, Guest_ID: gstRes.data[0].Guest_ID }));
      }
    } catch (err) {
      console.error('Failed to load services data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', serviceForm);
      setServiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create service');
    }
  };

  const handleAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services/assign', assignForm);
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign service to guest');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Delete service item from catalog?')) return;
    try {
      await api.delete(`/services/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Receptionist';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Hotel Services & Amenities Catalog
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            MySQL Tables: <code>Service</code> ⟷ <code>Service_Record</code>
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAssignModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 border border-acc-300 dark:border-acc-700 bg-white dark:bg-acc-900 text-acc-900 dark:text-acc-100 font-semibold text-xs rounded hover:bg-acc-100 transition-colors"
            >
              <UserPlus size={16} />
              <span>Assign Service to Guest</span>
            </button>
            <button
              onClick={() => setServiceModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-semibold text-xs rounded transition-colors"
            >
              <Plus size={16} />
              <span>Add Service Item</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Service Catalog List */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-acc-500 font-semibold">
            Catalog Services
          </h3>
          <div className="space-y-2">
            {services.map(s => (
              <div key={s.Service_ID} className="panel-card p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-acc-950 dark:text-acc-100">{s.Service_Name}</h4>
                  <p className="text-[11px] text-acc-500 mt-0.5">{s.Service_Description || 'No description'}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-acc-950 dark:text-acc-50">৳{Number(s.Service_Charge).toLocaleString()}</div>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDeleteService(s.Service_ID)}
                      className="text-[10px] text-red-500 hover:underline mt-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Service Activity Records */}
        <div className="space-y-3 lg:col-span-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-acc-500 font-semibold">
            Assigned Guest Service Logs
          </h3>

          <div className="panel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
                  <tr>
                    <th className="p-3 font-semibold">Record ID</th>
                    <th className="p-3 font-semibold">Guest</th>
                    <th className="p-3 font-semibold">Service Name</th>
                    <th className="p-3 font-semibold">Qty</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold text-right">Total Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-acc-500">Loading service logs...</td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-acc-500">No service charges logged yet.</td>
                    </tr>
                  ) : (
                    records.map(r => (
                      <tr key={r.Service_Record_ID} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                        <td className="p-3 font-bold text-acc-950 dark:text-acc-50">#LOG-{r.Service_Record_ID}</td>
                        <td className="p-3 font-sans font-semibold text-acc-950 dark:text-acc-100">
                          {r.First_Name} {r.Last_Name}
                        </td>
                        <td className="p-3">{r.Service_Name}</td>
                        <td className="p-3 font-bold">{r.Quantity}</td>
                        <td className="p-3">{r.Service_Date ? new Date(r.Service_Date).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-3 text-right font-bold text-acc-950 dark:text-acc-50">
                          ৳{Number(r.Charge).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
              Add New Service to Catalog
            </h3>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.Service_Name}
                  onChange={(e) => setServiceForm({ ...serviceForm, Service_Name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                  placeholder="e.g. Executive Airport Shuttle"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Service Charge ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={serviceForm.Service_Charge}
                  onChange={(e) => setServiceForm({ ...serviceForm, Service_Charge: parseFloat(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  value={serviceForm.Service_Description}
                  onChange={(e) => setServiceForm({ ...serviceForm, Service_Description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100 dark:border-acc-800">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-3 py-1.5 border border-acc-300 text-xs rounded hover:bg-acc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs rounded"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Service Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
              Assign Service to Guest
            </h3>

            <form onSubmit={handleAssignService} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Guest *</label>
                <select
                  value={assignForm.Guest_ID}
                  onChange={(e) => setAssignForm({ ...assignForm, Guest_ID: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                >
                  {guests.map(g => (
                    <option key={g.Guest_ID} value={g.Guest_ID}>
                      {g.First_Name} {g.Last_Name} (#{g.Guest_ID})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Service Item *</label>
                <select
                  value={assignForm.Service_ID}
                  onChange={(e) => setAssignForm({ ...assignForm, Service_ID: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                >
                  {services.map(s => (
                    <option key={s.Service_ID} value={s.Service_ID}>
                      {s.Service_Name} (${Number(s.Service_Charge).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={assignForm.Quantity}
                    onChange={(e) => setAssignForm({ ...assignForm, Quantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Service Date</label>
                  <input
                    type="date"
                    value={assignForm.Service_Date}
                    onChange={(e) => setAssignForm({ ...assignForm, Service_Date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100 dark:border-acc-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-3 py-1.5 border border-acc-300 text-xs rounded hover:bg-acc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs rounded"
                >
                  Confirm & Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
