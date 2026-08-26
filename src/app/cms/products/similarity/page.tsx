'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, RefreshCw } from 'lucide-react';
import { useT } from '../../_lib/i18n';

const LOCALES = ['en', 'es', 'pt', 'fr', 'it', 'de', 'he'] as const;
const THRESHOLDS = ['0.25', '0.35', '0.5'] as const;

type SortKey = 'overall' | 'name' | 'short' | 'full';
type StatusFilter = 'all' | 'active' | 'inactive';

interface ProductRef {
  id: number;
  name: string;
  slug: string;
  modelNumber: string | null;
  isActive: boolean;
}

interface SeoRisk {
  level: 'duplicate' | 'high' | 'moderate' | 'none';
  titleRisk: boolean;
  metaRisk: boolean;
}

interface SimilarPair {
  a: ProductRef;
  b: ProductRef;
  nameScore: number;
  shortScore: number;
  fullScore: number;
  overall: number;
  risk: SeoRisk;
}

interface Report {
  scannedCount: number;
  pairCount: number;
  truncated: boolean;
  pairs: SimilarPair[];
}

function percent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export default function ProductSimilarityPage() {
  const { t } = useT();
  const [locale, setLocale] = useState<string>('en');
  const [threshold, setThreshold] = useState<string>('0.35');
  const [sort, setSort] = useState<SortKey>('full');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scanNonce, setScanNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/products/similarity?locale=${locale}&threshold=${threshold}&sort=${sort}&status=${status}`)
      .then((res) => {
        if (!res.ok) throw new Error('scan failed');
        return res.json();
      })
      .then((data: Report) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) {
          setReport(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, threshold, sort, status, scanNonce]);

  function sortableHeader(key: SortKey, label: string) {
    const active = sort === key;
    return (
      <th className="text-left py-3 pr-4">
        <button
          type="button"
          onClick={() => setSort(key)}
          title={t('prod.sim.sortBy', { col: label })}
          className={`inline-flex items-center gap-1 hover:text-accent-navy ${active ? 'text-accent-navy' : ''}`}
        >
          {label} {active && <ArrowDown size={12} />}
        </button>
      </th>
    );
  }

  function riskBadge(risk: SeoRisk) {
    const levelStyles: Record<SeoRisk['level'], string> = {
      duplicate: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      moderate: 'bg-amber-100 text-amber-700',
      none: 'bg-gray-100 text-gray-500',
    };
    return (
      <div className="flex flex-wrap items-center gap-1">
        <span
          title={t(`prod.sim.risk.${risk.level}.tip`)}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelStyles[risk.level]}`}
        >
          {t(`prod.sim.risk.${risk.level}`)}
        </span>
        {risk.titleRisk && (
          <span
            title={t('prod.sim.risk.title.tip')}
            className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
          >
            {t('prod.sim.risk.titleTag')}
          </span>
        )}
        {risk.metaRisk && (
          <span
            title={t('prod.sim.risk.meta.tip')}
            className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700"
          >
            {t('prod.sim.risk.metaTag')}
          </span>
        )}
      </div>
    );
  }

  function productCell(product: ProductRef) {
    return (
      <div>
        <Link href={`/cms/products/${product.id}`} className="font-medium text-accent-navy hover:underline">
          {product.name}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-secondary">
          {product.modelNumber && <span>{product.modelNumber}</span>}
          {!product.isActive && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
              {t('prod.sim.inactive')}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/cms/products" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} /> {t('pe.back')}
      </Link>

      <h1 className="text-2xl font-heading font-bold mb-2">{t('prod.sim.title')}</h1>
      <p className="text-sm text-text-secondary mb-6">{t('prod.sim.desc')}</p>

      <div className="cms-card mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('prod.sim.locale')}</label>
            <select value={locale} onChange={(e) => setLocale(e.target.value)} className="input-field w-32">
              {LOCALES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('prod.sim.threshold')}</label>
            <select value={threshold} onChange={(e) => setThreshold(e.target.value)} className="input-field w-32">
              {THRESHOLDS.map((v) => (
                <option key={v} value={v}>{Math.round(parseFloat(v) * 100)}%</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('prod.sim.status')}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="input-field w-40">
              <option value="all">{t('prod.sim.status.all')}</option>
              <option value="active">{t('prod.sim.status.active')}</option>
              <option value="inactive">{t('prod.sim.status.inactive')}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setScanNonce((n) => n + 1)}
            disabled={loading}
            className="btn-outline h-10 px-4 text-xs tracking-normal normal-case disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> {t('prod.sim.rescan')}
          </button>
          {report && !loading && (
            <p className="text-sm text-text-secondary md:ml-auto md:self-center">
              {t('prod.sim.summary', { n: report.scannedCount, m: report.pairCount })}
              {report.truncated && <> {t('prod.sim.truncated', { n: report.pairs.length })}</>}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('prod.sim.error')}
        </div>
      )}

      <div className="cms-card overflow-x-auto">
        {loading ? (
          <p className="text-center text-text-secondary py-8">{t('prod.sim.scanning')}</p>
        ) : !report || report.pairs.length === 0 ? (
          !error && <p className="text-center text-text-secondary py-8">{t('prod.sim.empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4">{t('prod.sim.col.productA')}</th>
                <th className="text-left py-3 pr-4">{t('prod.sim.col.productB')}</th>
                {sortableHeader('name', t('prod.sim.col.name'))}
                {sortableHeader('short', t('prod.sim.col.short'))}
                {sortableHeader('full', t('prod.sim.col.full'))}
                {sortableHeader('overall', t('prod.sim.col.overall'))}
                <th className="text-left py-3">{t('prod.sim.col.risk')}</th>
              </tr>
            </thead>
            <tbody>
              {report.pairs.map((pair) => (
                <tr key={`${pair.a.id}-${pair.b.id}`} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4">{productCell(pair.a)}</td>
                  <td className="py-3 pr-4">{productCell(pair.b)}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(pair.nameScore)}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(pair.shortScore)}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(pair.fullScore)}</td>
                  <td className="py-3 pr-4 tabular-nums">{percent(pair.overall)}</td>
                  <td className="py-3">{riskBadge(pair.risk)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
