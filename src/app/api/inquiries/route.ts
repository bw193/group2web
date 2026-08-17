import { after, NextRequest, NextResponse } from 'next/server';
import { getDb, withDbRetryFast } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { distributeInquiry } from '@/lib/inquiry-distribution';

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  productInterest: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  // Honeypot. Trimmed so a browser autofilling whitespace into the hidden
  // field cannot get a real customer's inquiry silently discarded.
  website: z.string().trim().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  const allInquiries = await withDbRetryFast(() =>
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
  );
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

    // Honeypot submissions receive a normal success response so basic bots do
    // not learn how to bypass the trap, but nothing is stored or emailed.
    if (data.website) {
      return NextResponse.json({ message: 'Inquiry submitted successfully' }, { status: 201 });
    }

    const db = getDb();

    const [createdInquiry] = await db
      .insert(inquiries)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        country: data.country || null,
        productInterest: data.productInterest || null,
        message: data.message,
      })
      .returning();

    after(async () => {
      try {
        const distribution = await distributeInquiry(createdInquiry, request.nextUrl.origin);
        if (distribution.status === 'skipped') {
          console.warn(
            `[inquiry-distribution] Inquiry ${createdInquiry.id} skipped: ${distribution.reason}`,
          );
        }
      } catch (error) {
        // The inquiry is already safely stored. Do not show a submission failure
        // to the customer just because the notification provider is unavailable.
        console.error(`[inquiry-distribution] Inquiry ${createdInquiry.id} delivery failed:`, error);
      }
    });

    return NextResponse.json({ message: 'Inquiry submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
