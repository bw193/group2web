'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, MessageSquare, Image, Users, ArrowUpRight } from 'lucide-react';

interface Stats {
  products: number;
  inquiries: number;
  unreadInquiries: number;
  banners: number;
  users: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ products: 0, inquiries: 0, unreadInquiries: 0, banners: 0, users: 0 });
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);

  useEffect(() => {
    // Fetch stats
    Promise.all([
      fetch('/api/products?locale=en').then((r) => r.json()),
      fetch('/api/inquiries').then((r) => r.json()),
      fetch('/api/banners').then((r) => r.json()),
    ]).then(([products, inquiries, banners]) => {
      setStats({
        products: Array.isArray(products) ? products.length : 0,
        inquiries: Array.isArray(inquiries) ? inquiries.length : 0,
        unreadInquiries: Array.isArray(inquiries) ? inquiries.filter((i: any) => !i.isRead).length : 0,
        banners: Array.isArray(banners) ? banners.length : 0,
        users: 0,
      });
      if (Array.isArray(inquiries)) {
        setRecentInquiries(inquiries.slice(0, 5));
      }
    }).catch(console.error);
  }, []);

  const cards = [
    { label: 'Products', value: stats.products, icon: Package, href: '/cms/products', color: 'bg-blue-50 text-blue-600' },
    { label: 'Inquiries', value: stats.inquiries, icon: MessageSquare, href: '/cms/inquiries', color: 'bg-green-50 text-green-600', badge: stats.unreadInquiries > 0 ? `${stats.unreadInquiries} unread` : undefined },
    { label: 'Banners', value: stats.banners, icon: Image, href: '/cms/banners', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="cms-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-text-secondary">{card.label}</p>
            {card.badge && (
              <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {card.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Recent Inquiries */}
      <div className="cms-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Inquiries</h2>
          <Link href="/cms/inquiries" className="text-sm text-accent-navy hover:underline">
            View all
          </Link>
        </div>
        {recentInquiries.length === 0 ? (
          <p className="text-sm text-text-secondary py-4">No inquiries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">Email</th>
                  <th className="text-left py-2 font-medium">Product</th>
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((inq: any) => (
                  <tr key={inq.id} className="border-b last:border-0">
                    <td className="py-2.5">{inq.name}</td>
                    <td className="py-2.5 text-text-secondary">{inq.email}</td>
                    <td className="py-2.5 text-text-secondary">{inq.productInterest || '-'}</td>
                    <td className="py-2.5 text-text-secondary">{new Date(inq.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inq.isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
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
