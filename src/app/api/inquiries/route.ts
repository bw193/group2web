import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const inquirySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  productInterest: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  const allInquiries = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  return NextResponse.json(allInquiries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const data = parsed.data;
    const db = getDb();

    await db.insert(inquiries).values({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      country: data.country || null,
      productInterest: data.productInterest || null,
      message: data.message,
    });

    return NextResponse.json({ message: 'Inquiry submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
