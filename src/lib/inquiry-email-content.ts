export interface InquiryEmailDetails {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  productInterest: string | null;
  message: string;
  createdAt: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanSubjectPart(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function buildInquiryEmail(inquiry: InquiryEmailDetails) {
  const subjectContext = cleanSubjectPart(inquiry.productInterest || 'General inquiry');
  const subjectName = cleanSubjectPart(inquiry.name);
  const subject = `[Website Inquiry #${inquiry.id}] ${subjectContext} — ${subjectName}`;

  const fields = [
    ['Name', inquiry.name],
    ['Email', inquiry.email],
    ['Phone', inquiry.phone],
    ['Company', inquiry.company],
    ['Country', inquiry.country],
    ['Product interest', inquiry.productInterest],
    ['Received', new Date(inquiry.createdAt).toISOString()],
  ].filter((field): field is [string, string] => Boolean(field[1]));

  const detailRows = fields
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 16px 6px 0;color:#667085;font-size:14px;vertical-align:top;white-space:nowrap;">${label}</td>
          <td style="padding:6px 0;color:#101828;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,sans-serif;color:#101828;">
    <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #eaecf0;border-radius:12px;overflow:hidden;">
        <div style="padding:24px 28px;background:#101828;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#d6b98c;">New website inquiry</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.35;">Inquiry #${inquiry.id} from ${escapeHtml(inquiry.name)}</h1>
        </div>
        <div style="padding:24px 28px;">
          <table role="presentation" style="border-collapse:collapse;width:100%;">${detailRows}
          </table>
          <div style="margin-top:22px;padding:18px;background:#f9fafb;border-left:3px solid #b08a54;white-space:pre-wrap;font-size:15px;line-height:1.65;">${escapeHtml(inquiry.message)}</div>
          <p style="margin:22px 0 0;color:#667085;font-size:13px;line-height:1.5;">Reply to this email to contact ${escapeHtml(inquiry.name)} directly.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `New website inquiry #${inquiry.id}`,
    '',
    ...fields.map(([label, value]) => `${label}: ${value}`),
    '',
    'Message:',
    inquiry.message,
    '',
    `Reply to this email to contact ${inquiry.name} directly.`,
  ].join('\n');

  return { subject, html, text };
}
