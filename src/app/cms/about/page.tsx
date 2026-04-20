'use client';

import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

export default function AboutManagementPage() {
  const [content, setContent] = useState('');
  const [factorySize, setFactorySize] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [annualCapacity, setAnnualCapacity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Fetch about page data via a dedicated endpoint or from settings
    fetch('/api/about')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setContent(data.content || '');
          setFactorySize(data.factorySize || '');
          setEmployeeCount(data.employeeCount || '');
          setAnnualCapacity(data.annualCapacity || '');
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, factorySize, employeeCount, annualCapacity, locale: 'en' }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">About Page</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          <Save size={16} className="mr-1" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">Company Introduction (HTML)</h2>
          <textarea
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field font-mono text-xs"
            placeholder="<p>Company description here...</p>"
          />
        </div>

        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">Factory Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Facility Size</label>
              <input
                type="text"
                value={factorySize}
                onChange={(e) => setFactorySize(e.target.value)}
                className="input-field"
                placeholder="35,000㎡"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Employee Count</label>
              <input
                type="text"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                className="input-field"
                placeholder="200+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Annual Capacity</label>
              <input
                type="text"
                value={annualCapacity}
                onChange={(e) => setAnnualCapacity(e.target.value)}
                className="input-field"
                placeholder="500,000 units"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
