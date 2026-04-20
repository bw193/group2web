import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  const allInquiries = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Country', 'Product Interest', 'Message', 'Read', 'Replied', 'Date'];
  const rows = allInquiries.map((inq) => [
    inq.id,
    `"${(inq.name || '').replace(/"/g, '""')}"`,
    inq.email,
    inq.phone || '',
    `"${(inq.company || '').replace(/"/g, '""')}"`,
    inq.country || '',
    `"${(inq.productInterest || '').replace(/"/g, '""')}"`,
    `"${(inq.message || '').replace(/"/g, '""')}"`,
    inq.isRead ? 'Yes' : 'No',
    inq.isReplied ? 'Yes' : 'No',
    inq.createdAt,
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=inquiries.csv',
    },
  });
}
