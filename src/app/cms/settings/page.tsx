'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useT } from '../_lib/i18n';
import type { CmsKey } from '../_lib/translations';

export default function SettingsPage() {
  const { t } = useT();
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: '',
    slogan: '',
    contact_email: '',
    whatsapp: '',
    address: '',
    copyright: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const fields: { key: string; labelKey: CmsKey }[] = [
    { key: 'company_name', labelKey: 'set.field.company_name' },
    { key: 'slogan', labelKey: 'set.field.slogan' },
    { key: 'contact_email', labelKey: 'set.field.contact_email' },
    { key: 'whatsapp', labelKey: 'set.field.whatsapp' },
    { key: 'address', labelKey: 'set.field.address' },
    { key: 'copyright', labelKey: 'set.field.copyright' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('set.title')}</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          <Save size={16} className="mr-1" />
          {saving ? t('common.saving') : saved ? t('common.saved') : t('common.saveChanges')}
        </button>
      </div>

      <div className="cms-card">
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium mb-1.5">{t(field.labelKey)}</label>
              {field.key === 'address' ? (
                <textarea
                  rows={2}
                  value={settings[field.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="input-field"
                />
              ) : (
                <input
                  type="text"
                  value={settings[field.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="input-field"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
