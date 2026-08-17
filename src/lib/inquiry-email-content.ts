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

export interface InquiryEmailOptions {
  inquiryUrl?: string | null;
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

export function buildInquiryEmail(inquiry: InquiryEmailDetails, options: InquiryEmailOptions = {}) {
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

  const customerEmailHtml = options.inquiryUrl
    ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.5;"><a href="${escapeHtml(options.inquiryUrl)}" style="color:#2563eb;text-decoration:underline;">打开后台复制客户邮箱</a></p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#475467;">客户邮箱: <a href="mailto:${escapeHtml(inquiry.email)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(inquiry.email)}</a></p>`
    : `<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#475467;">客户邮箱: <a href="mailto:${escapeHtml(inquiry.email)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(inquiry.email)}</a></p>`;

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
          ${customerEmailHtml}
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
    ...(options.inquiryUrl ? [`打开后台复制客户邮箱: ${options.inquiryUrl}`] : []),
    `客户邮箱: ${inquiry.email}`,
  ].join('\n');

  return { subject, html, text };
}
