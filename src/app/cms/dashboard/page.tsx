'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Package,
  HelpCircle,
  Award,
  Building2,
  MessageSquare,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

interface Counts {
  banners: number;
  bannersActive: number;
  featuredProducts: number;
  totalProducts: number;
  facilityImages: number;
  certImages: number;
  faqs: number;
  faqsActive: number;
  inquiries: number;
  unreadInquiries: number;
}

const initial: Counts = {
  banners: 0, bannersActive: 0,
  featuredProducts: 0, totalProducts: 0,
  facilityImages: 0, certImages: 0,
  faqs: 0, faqsActive: 0,
  inquiries: 0, unreadInquiries: 0,
};

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts>(initial);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/banners?locale=en').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/products?locale=en').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/about/gallery?type=factory').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/about/gallery?type=certification').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/faqs?all=1').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/inquiries').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([banners, products, factory, cert, faqs, inquiries]) => {
        setCounts({
          banners: banners.length,
          bannersActive: banners.filter((b: any) => b.isActive).length,
          totalProducts: products.length,
          featuredProducts: products.filter((p: any) => p.isFeatured).length,
          facilityImages: factory.length,
          certImages: cert.length,
          faqs: faqs.length,
          faqsActive: faqs.filter((f: any) => f.isActive).length,
          inquiries: inquiries.length,
          unreadInquiries: inquiries.filter((i: any) => !i.isRead).length,
        });
        setRecentInquiries(Array.isArray(inquiries) ? inquiries.slice(0, 5) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Mirrors the home-page section ordering & eyebrow numerals
  const homeSections = [
    {
      eyebrow: '01',
      title: 'Hero Banners',
      desc: 'Top-of-page rotating slides with localized titles & CTAs.',
      icon: ImageIcon,
      href: '/cms/banners',
      primary: counts.bannersActive,
      total: counts.banners,
      unit: counts.bannersActive === 1 ? 'slide live' : 'slides live',
      detail: `${counts.banners} total`,
    },
    {
      eyebrow: '02',
      title: 'Featured Products',
      desc: 'Products marked “featured” surface in the home grid by category.',
      icon: Package,
      href: '/cms/products',
      primary: counts.featuredProducts,
      total: counts.totalProducts,
      unit: 'on home grid',
      detail: `${counts.totalProducts} total in catalog`,
    },
    {
      eyebrow: '03',
      title: 'Facility Gallery',
      desc: 'Up to 4 photos appear in the “Inside the Factory” gallery.',
      icon: Building2,
      href: '/cms/about',
      primary: counts.facilityImages,
      total: 4,
      unit: counts.facilityImages === 1 ? 'image uploaded' : 'images uploaded',
      detail: counts.facilityImages >= 4 ? 'Gallery complete' : `${4 - counts.facilityImages} slot(s) free`,
    },
    {
      eyebrow: '04',
      title: 'Certifications',
      desc: 'Compliance badges shown in the Compliance section, dynamically.',
      icon: Award,
      href: '/cms/about',
      primary: counts.certImages,
      total: counts.certImages,
      unit: counts.certImages === 1 ? 'certificate' : 'certificates',
      detail: counts.certImages === 0 ? 'Showing fallback labels' : 'Auto-laid out',
    },
    {
      eyebrow: '05',
      title: 'FAQ',
      desc: 'Accordion of inquiries answered on the home page.',
      icon: HelpCircle,
      href: '/cms/faqs',
      primary: counts.faqsActive,
      total: counts.faqs,
      unit: counts.faqsActive === 1 ? 'question live' : 'questions live',
      detail: `${counts.faqs} total`,
    },
    {
      eyebrow: '06',
      title: 'Inquiries',
      desc: 'Inbound contact requests from the public site.',
      icon: MessageSquare,
      href: '/cms/inquiries',
      primary: counts.unreadInquiries,
      total: counts.inquiries,
      unit: 'unread',
      detail: `${counts.inquiries} total received`,
      highlight: counts.unreadInquiries > 0,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Page header — editorial eyebrow */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-medium text-[#9A8266] tracking-[0.3em] uppercase">
            Overview
          </span>
          <span className="h-px flex-1 bg-gray-200 max-w-[120px]" />
          <span className="text-[10px] text-gray-400 tracking-[0.25em] uppercase">
            {loading ? 'Syncing…' : 'Live'}
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1
              className="text-4xl md:text-5xl font-medium leading-tight text-gray-900"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              Home Page <em className="text-[#9A8266] italic font-light">Control</em>
            </h1>
            <p className="text-sm text-gray-500 mt-3 max-w-xl leading-relaxed">
              Every section of the public home page maps to a card below. Click in to edit
              what visitors see — banners, featured products, facility gallery, certifications, FAQ.
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-[11px] tracking-[0.2em] uppercase font-medium transition-colors"
          >
            View Live Site
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* Home page sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
        {homeSections.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="group relative bg-white border border-gray-200 hover:border-[#9A8266] transition-all duration-300 overflow-hidden"
          >
            {/* Corner ticks — appear on hover */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#9A8266]/0 group-hover:border-[#9A8266] transition-colors duration-500" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#9A8266]/0 group-hover:border-[#9A8266] transition-colors duration-500" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#9A8266]/0 group-hover:border-[#9A8266] transition-colors duration-500" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#9A8266]/0 group-hover:border-[#9A8266] transition-colors duration-500" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-[#9A8266]">
                    {s.eyebrow}
                  </span>
                  <span className="w-6 h-px bg-gray-200 group-hover:bg-[#9A8266] group-hover:w-10 transition-all duration-500" />
                </div>
                <div className="w-9 h-9 border border-gray-200 group-hover:border-[#9A8266] flex items-center justify-center transition-colors duration-300">
                  <s.icon size={16} strokeWidth={1.5} className="text-gray-600 group-hover:text-[#9A8266] transition-colors" />
                </div>
              </div>

              <h3
                className="text-2xl font-medium text-gray-900 leading-tight mb-1"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
              >
                {s.title}
              </h3>
              <p className="text-[12px] text-gray-500 leading-relaxed mb-5 min-h-[36px]">
                {s.desc}
              </p>

              {/* Live count */}
              <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-light leading-none ${s.highlight ? 'text-amber-600' : 'text-gray-900'}`}
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                    >
                      {loading ? '—' : s.primary}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
                      {s.unit}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 tracking-wide">
                    {s.detail}
                  </p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-gray-300 group-hover:text-[#9A8266] transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </div>
            </div>

            {s.highlight && !loading && s.primary > 0 && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] tracking-[0.15em] uppercase font-medium">
                Action needed
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white border border-gray-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-[#9A8266] tracking-[0.3em] uppercase">
              Latest
            </span>
            <span className="w-8 h-px bg-gray-200" />
            <h2
              className="text-xl font-medium text-gray-900"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              Recent Inquiries
            </h2>
          </div>
          <Link
            href="/cms/inquiries"
            className="text-[11px] tracking-[0.2em] uppercase text-gray-500 hover:text-[#9A8266] transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentInquiries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No inquiries yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Product</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((inq: any) => (
                  <tr key={inq.id} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800">{inq.name}</td>
                    <td className="px-6 py-3.5 text-gray-500">{inq.email}</td>
                    <td className="px-6 py-3.5 text-gray-500">{inq.productInterest || '—'}</td>
                    <td className="px-6 py-3.5 text-gray-500">{new Date(inq.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-[10px] px-2.5 py-1 tracking-[0.15em] uppercase font-medium ${
                          inq.isRead
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-[#9A8266]/10 text-[#7a6750]'
                        }`}
                      >
                        {inq.isRead ? 'Read' : 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
