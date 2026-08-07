import React, { useState } from 'react';
import { Gear, Globe, Database, ShieldCheck, CheckCircle } from '@phosphor-icons/react';

export const SettingsPage: React.FC = () => {
  const [currency, setCurrency] = useState('BDT (৳)');
  const [taxRate, setTaxRate] = useState('10');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-acc-950 dark:text-acc-50">
          System & Localization Settings
        </h1>
        <p className="text-xs text-acc-500 font-mono">
          Configure default region, currency formatting, and tax rules for Hotel.com
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center gap-2">
          <CheckCircle size={16} />
          <span>System configuration saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="panel-card p-6 space-y-4">
        <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2">
          Regional Localization
        </h3>

        <div>
          <label className="block text-xs font-medium mb-1">Base Operating Region</label>
          <input
            type="text"
            disabled
            value="Bangladesh (BD)"
            className="w-full px-3 py-1.5 bg-acc-100 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono text-acc-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Display Currency Symbol</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
          >
            <option value="BDT (৳)">Bangladeshi Taka (BDT ৳)</option>
            <option value="USD ($)">United States Dollar ($)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Standard Government VAT / Tax Rate (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full px-3 py-1.5 bg-acc-50 dark:bg-acc-800 border border-acc-300 dark:border-acc-700 rounded text-xs font-mono"
          />
        </div>

        <h3 className="font-bold text-sm text-acc-950 dark:text-acc-50 border-b border-acc-100 dark:border-acc-800 pb-2 pt-2">
          Database Connection Information
        </h3>

        <div className="p-3 bg-acc-50 dark:bg-acc-850 rounded border border-acc-200 dark:border-acc-800 font-mono text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-acc-500">Database Engine:</span>
            <span className="font-semibold">XAMPP MariaDB / MySQL 8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-acc-500">Host & Port:</span>
            <span>localhost:3306</span>
          </div>
          <div className="flex justify-between">
            <span className="text-acc-500">Database Name:</span>
            <span className="text-emerald-600 font-bold">Hotel_Management_System</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-acc-950 text-white dark:bg-brand-500 dark:text-acc-950 font-semibold text-xs rounded"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
