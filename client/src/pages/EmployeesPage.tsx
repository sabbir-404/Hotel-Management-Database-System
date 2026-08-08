import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { Employee, Hotel } from '../types';
import { useAuth } from '../context/AuthContext';
import { UserPlus, PencilSimple, Trash, MagnifyingGlass } from '@phosphor-icons/react';

export const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    Phone_Number: '',
    Email: '',
    Password: '',
    Address: '',
    Nationality: 'Bangladeshi',
    Hotel_ID: 1,
    Designation: 'Receptionist',
    Salary: 45000.00,
    Joining_Date: new Date().toISOString().split('T')[0],
    Employment_Status: 'Active' as Employee['Employment_Status']
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, hotelRes] = await Promise.all([
        api.get('/employees'),
        api.get('/hotels')
      ]);
      setEmployees(empRes.data);
      setHotels(hotelRes.data);
      if (hotelRes.data.length > 0) {
        setFormData(prev => ({ ...prev, Hotel_ID: hotelRes.data[0].Hotel_ID }));
      }
    } catch (err) {
      console.error('Failed to load employee directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      First_Name: '',
      Last_Name: '',
      Phone_Number: '',
      Email: '',
      Password: '',
      Address: '',
      Nationality: 'Bangladeshi',
      Hotel_ID: hotels[0]?.Hotel_ID || 1,
      Designation: 'Receptionist',
      Salary: 45000.00,
      Joining_Date: new Date().toISOString().split('T')[0],
      Employment_Status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      First_Name: emp.First_Name,
      Last_Name: emp.Last_Name,
      Phone_Number: emp.Phone_Number || '',
      Email: emp.Email || '',
      Password: '',
      Address: emp.Address || '',
      Nationality: emp.Nationality || 'Bangladeshi',
      Hotel_ID: emp.Hotel_ID,
      Designation: emp.Designation,
      Salary: Number(emp.Salary),
      Joining_Date: emp.Joining_Date ? emp.Joining_Date.split('T')[0] : new Date().toISOString().split('T')[0],
      Employment_Status: emp.Employment_Status
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.Employee_ID}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save employee record');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff record?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(e =>
    `${e.First_Name} ${e.Last_Name}`.toLowerCase().includes(search.toLowerCase()) ||
    e.Designation.toLowerCase().includes(search.toLowerCase()) ||
    (e.Hotel_Name && e.Hotel_Name.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadge = (status: Employee['Employment_Status']) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'Inactive':
        return 'bg-acc-100 text-acc-800 dark:bg-acc-800 dark:text-acc-300 border-acc-300';
      case 'On Leave':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-acc-100 text-acc-800';
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Employee & Personnel Directory
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            Relational MySQL Table: <code>Employee</code>
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3 py-2 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-semibold text-xs rounded transition-colors"
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="panel-card p-3 flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-acc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, designation, or hotel..."
            className="w-full pl-9 pr-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-200 dark:border-acc-700 rounded text-xs focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
              <tr>
                <th className="p-3 font-semibold">Staff ID</th>
                <th className="p-3 font-semibold">Full Name</th>
                <th className="p-3 font-semibold">Designation</th>
                <th className="p-3 font-semibold">Hotel Assignment</th>
                <th className="p-3 font-semibold">Salary (BDT ৳)</th>
                <th className="p-3 font-semibold">Joining Date</th>
                <th className="p-3 font-semibold">Status</th>
                {canEdit && <th className="p-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-acc-500">Loading staff records...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-acc-500">No staff records found.</td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr key={e.Employee_ID} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">#EMP-{e.Employee_ID}</td>
                    <td className="p-3 font-sans font-semibold text-acc-950 dark:text-acc-100">
                      {e.First_Name} {e.Last_Name}
                    </td>
                    <td className="p-3 font-sans font-medium text-acc-900 dark:text-acc-200">{e.Designation}</td>
                    <td className="p-3">{e.Hotel_Name}</td>
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">
                      BDT ৳{Number(e.Salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">{new Date(e.Joining_Date || '').toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`badge-pill border ${getStatusBadge(e.Employment_Status)}`}>
                        {e.Employment_Status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(e)}
                            className="p-1.5 hover:bg-acc-200 dark:hover:bg-acc-700 rounded text-acc-700 dark:text-acc-300"
                            title="Edit Record"
                          >
                            <PencilSimple size={15} />
                          </button>
                          {user?.role === 'Admin' && (
                            <button
                              onClick={() => handleDelete(e.Employee_ID)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-red-600 dark:text-red-400"
                              title="Delete Record"
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
      {modalOpen && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
              {editingEmployee ? `Edit Employee Record (#EMP-${editingEmployee.Employee_ID})` : 'Add New Staff Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.First_Name}
                    onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.Last_Name}
                    onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.Phone_Number}
                    onChange={(e) => setFormData({ ...formData, Phone_Number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Account Password {editingEmployee ? '(Leave blank to keep unchanged)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingEmployee}
                  value={formData.Password}
                  onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                  placeholder={editingEmployee ? '••••••••' : 'Set Account Password'}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Hotel Assignment *</label>
                  <select
                    value={formData.Hotel_ID}
                    onChange={(e) => setFormData({ ...formData, Hotel_ID: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                  >
                    {hotels.map(h => (
                      <option key={h.Hotel_ID} value={h.Hotel_ID}>{h.Hotel_Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.Designation}
                    onChange={(e) => setFormData({ ...formData, Designation: e.target.value })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl"
                    placeholder="e.g. Receptionist, Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Salary (BDT ৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.Salary}
                    onChange={(e) => setFormData({ ...formData, Salary: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Employment Status</label>
                  <select
                    value={formData.Employment_Status}
                    onChange={(e) => setFormData({ ...formData, Employment_Status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.Joining_Date}
                  onChange={(e) => setFormData({ ...formData, Joining_Date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100 dark:border-acc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 border border-acc-300 dark:border-acc-700 text-xs rounded-xl hover:bg-acc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-acc-950 font-bold text-xs rounded-xl"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
