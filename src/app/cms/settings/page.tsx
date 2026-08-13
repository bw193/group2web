'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, MailCheck, Save } from 'lucide-react';
import { useT } from '../_lib/i18n';
import type { CmsKey } from '../_lib/translations';

interface Employee {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface InquiryRoutingResponse {
  employees: Employee[];
  recipientUserIds: number[];
  emailConfigured: boolean;
}

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recipientUserIds, setRecipientUserIds] = useState<number[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [settingsResponse, routingResponse] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/inquiry-routing'),
        ]);

        if (!settingsResponse.ok || !routingResponse.ok) throw new Error('Failed to load settings');

        const [settingsData, routingData] = await Promise.all([
          settingsResponse.json() as Promise<Record<string, string>>,
          routingResponse.json() as Promise<InquiryRoutingResponse>,
        ]);

        setSettings((prev) => ({ ...prev, ...settingsData }));
        setEmployees(routingData.employees);
        setRecipientUserIds(routingData.recipientUserIds);
        setEmailConfigured(routingData.emailConfigured);
      } catch {
        setSaveError(true);
      } finally {
        setRoutingLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError(false);

    try {
      const [settingsResponse, routingResponse] = await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }),
        fetch('/api/inquiry-routing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientUserIds }),
        }),
      ]);

      if (!settingsResponse.ok || !routingResponse.ok) throw new Error('Failed to save settings');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function toggleRecipient(userId: number) {
    setRecipientUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
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
        <button onClick={handleSave} disabled={saving || routingLoading} className="btn-primary text-sm disabled:opacity-50">
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

      <div className="cms-card mt-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <MailCheck size={20} />
          </div>
          <div>
            <h2 className="font-semibold">{t('set.inquiryRouting.title')}</h2>
            <p className="mt-1 text-sm text-text-secondary">{t('set.inquiryRouting.desc')}</p>
          </div>
        </div>

        {!routingLoading && (
          <div className={`mb-5 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
            emailConfigured
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            {emailConfigured ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
            <div>
              <p className="font-medium">
                {emailConfigured ? t('set.inquiryRouting.ready') : t('set.inquiryRouting.notConfigured')}
              </p>
              {!emailConfigured && (
                <p className="mt-0.5 text-xs">{t('set.inquiryRouting.notConfiguredHint')}</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium">{t('set.inquiryRouting.recipients')}</h3>
            <p className="mt-0.5 text-xs text-text-secondary">{t('set.inquiryRouting.approvedOnly')}</p>
          </div>
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
            {t('set.inquiryRouting.selected', { n: recipientUserIds.length })}
          </span>
        </div>

        {routingLoading ? (
          <p className="py-4 text-sm text-text-secondary">{t('common.loading')}</p>
        ) : employees.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-5 text-center text-sm text-text-secondary">
            {t('set.inquiryRouting.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {employees.map((employee) => {
              const checked = recipientUserIds.includes(employee.id);
              return (
                <label
                  key={employee.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRecipient(employee.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{employee.fullName}</span>
                    <span className="block truncate text-xs text-text-secondary">{employee.email}</span>
                    <span className="mt-1 inline-block rounded bg-white/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                      {employee.role === 'admin' ? t('users.role.admin') : t('users.role.editor')}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {saveError && (
          <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={15} /> {t('set.inquiryRouting.saveFailed')}
          </p>
        )}
      </div>
    </div>
  );
}
