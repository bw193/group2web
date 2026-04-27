'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useT } from '../_lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useT();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('login.failed'));
        return;
      }

      if (data.user.mustChangePassword) {
        router.push('/cms/change-password');
      } else {
        router.push('/cms/dashboard');
      }
    } catch {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Language toggle floating top-right */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 text-[11px] tracking-wide">
        <button
          onClick={() => setLang('en')}
          className={`px-2 py-0.5 transition-colors ${lang === 'en' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700'}`}
        >
          EN
        </button>
        <button
          onClick={() => setLang('zh')}
          className={`px-2 py-0.5 transition-colors ${lang === 'zh' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700'}`}
        >
          中文
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-text-primary">{t('login.brand')}</h1>
          <p className="text-sm text-text-secondary mt-1">{t('login.tagline')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold mb-6">{t('login.title')}</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('login.usernameOrEmail')}</label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('login.password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/cms/register" className="text-sm text-accent-navy hover:underline">
              {t('login.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
