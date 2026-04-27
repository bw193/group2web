'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '../_lib/i18n';

export default function RegisterPage() {
  const { t } = useT();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('register.failed'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-green-500 text-4xl mb-4">&#10003;</div>
          <h2 className="text-xl font-semibold mb-2">{t('register.successTitle')}</h2>
          <p className="text-sm text-text-secondary mb-6">
            {t('register.successBody')}
          </p>
          <Link href="/cms/login" className="btn-primary">
            {t('register.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-text-primary">{t('login.brand')}</h1>
          <p className="text-sm text-text-secondary mt-1">{t('register.tagline')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold mb-6">{t('register.title')}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.fullName')}</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.username')}</label>
              <input
                type="text"
                required
                minLength={3}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.email')}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.password')}</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
              />
              <p className="text-xs text-text-secondary mt-1">{t('register.minChars')}</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? t('register.creating') : t('register.create')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/cms/login" className="text-sm text-accent-navy hover:underline">
              {t('register.haveAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
