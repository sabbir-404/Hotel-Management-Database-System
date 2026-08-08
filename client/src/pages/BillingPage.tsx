import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bill, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Receipt, Printer, DownloadSimple, Plus, Eye, CheckCircle, Calculator } from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Bill Generation Modal
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [selectedResId, setSelectedResId] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Banking' | 'Bank Transfer'>('Card');
  const [taxesInput, setTaxesInput] = useState<string>('');
  const [discountsInput, setDiscountsInput] = useState<string>('0');

  // Printable / Preview Invoice Modal
  const [viewBill, setViewBill] = useState<Bill | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billRes, resRes] = await Promise.all([
        api.get('/bills'),
        api.get('/reservations?status=Checked In')
      ]);
      setBills(billRes.data);
      setActiveReservations(resRes.data);
      if (resRes.data.length > 0) {
        setSelectedResId(resRes.data[0].Reservation_ID);
      }
    } catch (err) {
      console.error('Failed to load bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (billId: number, newStatus: string) => {
    try {
      await api.put(`/bills/${billId}`, { Payment_Status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update payment status');
    }
  };

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) return;

    try {
      const res = await api.post('/bills/generate', {
        Reservation_ID: selectedResId,
        Payment_Method: paymentMethod,
        Taxes: taxesInput ? parseFloat(taxesInput) : undefined,
        Discounts: discountsInput ? parseFloat(discountsInput) : 0
      });
      setGenModalOpen(false);
      fetchData();
      // Auto open detailed invoice
      handleViewInvoice(res.data.Bill_ID);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate bill');
    }
  };

  const handleViewInvoice = async (billId: number) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      setViewBill(res.data);
    } catch (err: any) {
      alert('Failed to load bill invoice details');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!viewBill) return;

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('HOTEL INVOICE STATEMENT', 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice ID: #INV-${viewBill.Bill_ID}`, 14, 28);
    doc.text(`Billing Date: ${new Date(viewBill.Billing_Date).toLocaleDateString()}`, 14, 34);
    doc.text(`Guest: ${viewBill.First_Name} ${viewBill.Last_Name}`, 14, 40);
    doc.text(`Hotel: ${viewBill.Hotel_Name}`, 14, 46);
    doc.text(`Room: Room ${viewBill.Room_Number} (${viewBill.Room_Type})`, 14, 52);

    doc.line(14, 58, 196, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('Item Breakdown', 14, 66);
    doc.text('Amount (BDT)', 160, 66);

    let y = 74;
    doc.setFont('helvetica', 'normal');
    doc.text(`Room Stay (${viewBill.Total_Nights || 1} Night(s) @ BDT ${Number(viewBill.Nightly_Rate || 0).toLocaleString()})`, 14, y);
    doc.text(`BDT ${Number(Number(viewBill.Nightly_Rate || 0) * Number(viewBill.Total_Nights || 1)).toLocaleString()}`, 160, y);
    y += 8;

    if (viewBill.items && viewBill.items.length > 0) {
      viewBill.items.forEach(item => {
        doc.text(`${item.Service_Name || 'Service Charge'} (Qty: ${item.Quantity})`, 14, y);
        doc.text(`BDT ${Number(item.Charge || item.Total_Cost || 0).toLocaleString()}`, 160, y);
        y += 8;
      });
    }

    doc.line(14, y, 196, y);
    y += 8;

    doc.text(`Subtotal:`, 120, y);
    doc.text(`BDT ${Number(viewBill.Total_Amount).toLocaleString()}`, 160, y);
    y += 6;
    doc.text(`Discounts (-):`, 120, y);
    doc.text(`BDT ${Number(viewBill.Discounts).toLocaleString()}`, 160, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Final Amount:`, 120, y);
    doc.text(`BDT ${Number(viewBill.Final_Amount).toLocaleString()}`, 160, y);

    doc.save(`Invoice_INV-${viewBill.Bill_ID}.pdf`);
  };

  const canGenerate = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Receptionist';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Billing & Invoice Management
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            Automated Pricing: Room Charge + Services - Discount (BDT ৳)
          </p>
        </div>

        {canGenerate && (
          <button
            onClick={() => setGenModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-acc-950 hover:bg-acc-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-acc-950 font-semibold text-xs rounded transition-colors"
          >
            <Plus size={16} />
            <span>Generate Bill for Guest</span>
          </button>
        )}
      </div>

      {/* Bills Ledger Table */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
              <tr>
                <th className="p-3 font-semibold">Bill ID</th>
                <th className="p-3 font-semibold">Guest Name</th>
                <th className="p-3 font-semibold">Hotel & Room</th>
                <th className="p-3 font-semibold">Billing Date</th>
                <th className="p-3 font-semibold">Payment Method</th>
                <th className="p-3 font-semibold font-mono">Final Total</th>
                <th className="p-3 font-semibold">Payment Status</th>
                <th className="p-3 font-semibold text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-acc-500">Loading invoice statements...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-acc-500">No generated bills found.</td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.Bill_ID} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">#INV-{b.Bill_ID}</td>
                    <td className="p-3 font-sans font-semibold text-acc-950 dark:text-acc-100">
                      {b.First_Name} {b.Last_Name}
                    </td>
                    <td className="p-3 font-sans">
                      <div>Room {b.Room_Number}</div>
                      <div className="text-[10px] text-acc-500">{b.Hotel_Name}</div>
                    </td>
                    <td className="p-3">{new Date(b.Billing_Date).toLocaleDateString()}</td>
                    <td className="p-3">{b.Payment_Method}</td>
                    <td className="p-3 font-bold text-acc-950 dark:text-acc-50">
                      BDT ৳{Number(b.Final_Amount).toLocaleString('en-US')}
                    </td>
                    <td className="p-3">
                      {canGenerate ? (
                        <select
                          value={b.Payment_Status}
                          onChange={(e) => handleStatusChange(b.Bill_ID, e.target.value)}
                          className={`px-2 py-1 text-xs rounded border font-mono font-bold cursor-pointer outline-none ${
                            b.Payment_Status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : b.Payment_Status === 'Cancelled'
                              ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`badge-pill border ${b.Payment_Status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                          {b.Payment_Status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleViewInvoice(b.Bill_ID)}
                        className="px-2 py-1 bg-acc-900 text-white dark:bg-brand-500 dark:text-acc-950 rounded text-[11px] font-mono inline-flex items-center gap-1 hover:opacity-90"
                      >
                        <Eye size={13} />
                        <span>View Statement</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      {genModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
              Generate Final Guest Bill
            </h3>

            <form onSubmit={handleGenerateBill} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Checked In Reservation *</label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                >
                  {activeReservations.length === 0 ? (
                    <option value={0}>No checked-in guests awaiting billing</option>
                  ) : (
                    activeReservations.map(r => (
                      <option key={r.Reservation_ID} value={r.Reservation_ID}>
                        #RES-{r.Reservation_ID}: {r.First_Name} {r.Last_Name} (Room {r.Room_Number})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                >
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Banking">Mobile Banking (bKash / Nagad)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Discount (BDT ৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={discountsInput}
                  onChange={(e) => setDiscountsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded-xl font-mono"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-acc-100 dark:border-acc-800">
                <button
                  type="button"
                  onClick={() => setGenModalOpen(false)}
                  className="px-3.5 py-2 border border-acc-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedResId}
                  className="px-4 py-2 bg-brand-500 text-acc-950 font-bold text-xs rounded-xl disabled:opacity-50 font-mono"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable / Downloadable Invoice Modal Statement */}
      {viewBill && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-acc-900 border border-acc-200 dark:border-acc-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Invoice Top Actions */}
            <div className="flex items-center justify-between border-b border-acc-200 dark:border-acc-800 pb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-acc-500 font-bold">
                Official Bill Invoice
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 border border-acc-300 dark:border-acc-700 rounded-xl text-xs font-mono hover:bg-acc-100"
                >
                  <Printer size={15} />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-3 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 rounded-xl text-xs font-mono font-semibold"
                >
                  <DownloadSimple size={15} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setViewBill(null)}
                  className="px-3.5 py-2 border border-acc-300 text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="space-y-6 text-acc-950 dark:text-acc-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{viewBill.Hotel_Name}</h2>
                  <p className="text-xs text-acc-500 font-mono">{viewBill.City} Hotel Branch</p>
                  <p className="text-xs text-acc-500 font-mono">Contact: {viewBill.Hotel_Contact || '+880-1711-001122'}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold font-mono text-acc-900 dark:text-acc-100">INVOICE</h3>
                  <p className="text-xs font-mono text-acc-500">Invoice ID: #INV-{viewBill.Bill_ID}</p>
                  <p className="text-xs font-mono text-acc-500">Date: {new Date(viewBill.Billing_Date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Guest & Reservation Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-acc-50 dark:bg-acc-800/60 rounded-xl border border-acc-200 dark:border-acc-700 text-xs font-mono">
                <div>
                  <p className="text-[10px] uppercase text-acc-500 font-semibold">Billed To Guest</p>
                  <p className="font-bold text-sm text-acc-950 dark:text-acc-50 mt-0.5">{viewBill.First_Name} {viewBill.Last_Name}</p>
                  <p className="text-acc-600 dark:text-acc-300">{viewBill.Email || 'No Email Registered'}</p>
                  <p className="text-acc-600 dark:text-acc-300">Phone: {viewBill.Phone_Number}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-acc-500 font-semibold">Stay Summary</p>
                  <p className="font-bold text-acc-950 dark:text-acc-50 mt-0.5">Room {viewBill.Room_Number} ({viewBill.Room_Type})</p>
                  <p className="text-acc-600 dark:text-acc-300">Check In: {new Date(viewBill.Check_In_Date || '').toLocaleDateString()}</p>
                  <p className="text-acc-600 dark:text-acc-300">Check Out: {new Date(viewBill.Check_Out_Date || '').toLocaleDateString()}</p>
                </div>
              </div>

              {/* Charges Table */}
              <table className="w-full text-left text-xs font-mono border border-acc-200 dark:border-acc-700">
                <thead className="bg-acc-100 dark:bg-acc-800">
                  <tr>
                    <th className="p-2 border-b border-acc-200 dark:border-acc-700">Description</th>
                    <th className="p-2 border-b border-acc-200 dark:border-acc-700 text-center">Qty / Nights</th>
                    <th className="p-2 border-b border-acc-200 dark:border-acc-700 text-right">Amount (BDT ৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-acc-200 dark:divide-acc-700">
                  <tr>
                    <td className="p-2">Room Accommodation Charge (BDT ৳{Number(viewBill.Nightly_Rate || 0).toLocaleString()}/night)</td>
                    <td className="p-2 text-center">{viewBill.Total_Nights || 1} Night(s)</td>
                    <td className="p-2 text-right font-bold">BDT ৳{(Number(viewBill.Nightly_Rate || 0) * Number(viewBill.Total_Nights || 1)).toLocaleString()}</td>
                  </tr>
                  {viewBill.items && viewBill.items.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2">{item.Service_Name || 'Service Charge'}</td>
                      <td className="p-2 text-center">{item.Quantity}</td>
                      <td className="p-2 text-right font-bold">BDT ৳{Number(item.Charge || item.Total_Cost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Invoice Totals Calculation */}
              <div className="flex justify-end font-mono text-xs">
                <div className="w-64 space-y-1.5 border-t border-acc-200 dark:border-acc-700 pt-3">
                  <div className="flex justify-between text-acc-600 dark:text-acc-400">
                    <span>Subtotal:</span>
                    <span>BDT ৳{Number(viewBill.Total_Amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-acc-600 dark:text-acc-400">
                    <span>Discount (-):</span>
                    <span>BDT ৳{Number(viewBill.Discounts).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-acc-950 dark:text-acc-50 border-t border-acc-950 dark:border-acc-50 pt-2">
                    <span>Final Amount:</span>
                    <span>BDT ৳{Number(viewBill.Final_Amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
