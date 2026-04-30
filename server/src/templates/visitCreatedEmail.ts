import { VisitData } from "../database/schema/Visit";

export interface VisitCreatedEmailInput {
    recipientName: string;
    visit: VisitData;
    detailsUrl: string;
    signupUrl: string;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function renderVisitCreatedEmail({
    recipientName,
    visit,
    detailsUrl,
    signupUrl,
}: VisitCreatedEmailInput): string {
    const customerName = escapeHtml(visit.customerName);
    const productLine = escapeHtml(visit.productLine);
    const location = escapeHtml(visit.location);
    const visitDetails = escapeHtml(visit.visitDetails || "N/A");
    const startDate = escapeHtml(visit.startDate);
    const endDate = escapeHtml(visit.endDate);
    const safeRecipientName = escapeHtml(recipientName);

    return `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;font-family:Arial,sans-serif;background:#f7f8fa;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;padding:24px;">
            <tr>
              <td>
                <h2 style="margin:0 0 16px 0;">A new visit matches your preferences</h2>
                <p style="margin:0 0 16px 0;">Hi ${safeRecipientName},</p>
                <p style="margin:0 0 16px 0;">
                  A new Smart Visit was just created and matches your profile preferences.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
                  <tr><td><strong>Customer:</strong> ${customerName}</td></tr>
                  <tr><td><strong>Product Line:</strong> ${productLine}</td></tr>
                  <tr><td><strong>Location:</strong> ${location}</td></tr>
                  <tr><td><strong>Dates:</strong> ${startDate} to ${endDate}</td></tr>
                  <tr><td><strong>Details:</strong> ${visitDetails}</td></tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:20px;">
                  <tr>
                    <td style="padding-right:12px;">
                      <a href="${detailsUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;">View Visit Details</a>
                    </td>
                    <td>
                      <a href="${signupUrl}" style="display:inline-block;padding:10px 16px;background:#059669;color:#ffffff;text-decoration:none;border-radius:4px;">Sign Up</a>
                    </td>
                  </tr>
                </table>

                <p style="margin-top:24px;font-size:12px;color:#6b7280;">
                  You are receiving this email because notifications are enabled in your profile.
                  You can disable email alerts from your profile settings at any time.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
