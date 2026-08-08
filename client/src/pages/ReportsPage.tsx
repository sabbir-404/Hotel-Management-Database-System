import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChartLineUp, DownloadSimple, FileText, Users, CurrencyDollar, CalendarCheck } from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'top-spenders' | 'upcoming-checkins' | 'employee-salary' | 'occupancy'>('top-spenders');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (tab: typeof activeTab) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tab === 'top-spenders') endpoint = '/reports/top-spenders';
      else if (tab === 'upcoming-checkins') endpoint = '/reports/upcoming-checkins';
      else if (tab === 'employee-salary') endpoint = '/reports/employee-salary';
      else if (tab === 'occupancy') endpoint = '/reports/occupancy';

      const res = await api.get(endpoint);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load analytics report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hotel_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`EXECUTIVE REPORT: ${activeTab.toUpperCase()}`, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.line(14, 30, 196, 30);

    let y = 40;
    reportData.slice(0, 20).forEach((item, index) => {
      const lineText = `${index + 1}. ` + Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(' | ');
      doc.text(lineText.substring(0, 110), 14, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Report_${activeTab}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
            Business Intelligence & Analytics Reports
          </h1>
          <p className="text-xs text-acc-500 font-mono">
            Analytical aggregation queries across MySQL dataset
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-acc-300 dark:border-acc-700 bg-white dark:bg-acc-900 text-xs font-mono rounded hover:bg-acc-100 transition-colors"
          >
            <DownloadSimple size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs font-mono rounded"
          >
            <FileText size={15} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-acc-200 dark:border-acc-800 space-x-4">
        <button
          onClick={() => setActiveTab('top-spenders')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'top-spenders'
              ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50'
              : 'border-transparent text-acc-500 hover:text-acc-900 dark:hover:text-acc-300'
          }`}
        >
          Highest Spending Guests
        </button>
        <button
          onClick={() => setActiveTab('upcoming-checkins')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'upcoming-checkins'
              ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50'
              : 'border-transparent text-acc-500 hover:text-acc-900 dark:hover:text-acc-300'
          }`}
        >
          Upcoming Check-ins
        </button>
        <button
          onClick={() => setActiveTab('occupancy')}
          className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
            activeTab === 'occupancy'
              ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50'
              : 'border-transparent text-acc-500 hover:text-acc-900 dark:hover:text-acc-300'
          }`}
        >
          Occupancy Rate Report
        </button>
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <button
            onClick={() => setActiveTab('employee-salary')}
            className={`pb-3 text-xs font-mono font-semibold transition-all border-b-2 ${
              activeTab === 'employee-salary'
                ? 'border-acc-950 text-acc-950 dark:border-brand-500 dark:text-acc-50'
                : 'border-transparent text-acc-500 hover:text-acc-900 dark:hover:text-acc-300'
            }`}
          >
            Employee Salary Report
          </button>
        )}
      </div>

      {/* Report Table Display */}
      <div className="panel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-acc-100 dark:bg-acc-800/60 font-mono uppercase text-[10px] tracking-wider text-acc-600 dark:text-acc-300 border-b border-acc-200 dark:border-acc-800">
              <tr>
                {reportData.length > 0 ? (
                  Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="p-3 font-semibold">{key.replace(/_/g, ' ')}</th>
                  ))
                ) : (
                  <th className="p-3 font-semibold">Report Results</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-acc-100 dark:divide-acc-800 font-mono text-acc-800 dark:text-acc-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-acc-500">Generating analytics query from MySQL database...</td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-acc-500">No report records found for this category.</td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-acc-50 dark:hover:bg-acc-850/50">
                    {Object.values(row).map((val: any, valIdx) => (
                      <td key={valIdx} className="p-3">
                        {typeof val === 'number' && valIdx > 2 ? `BDT ৳${val.toLocaleString()}` : String(val ?? 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
