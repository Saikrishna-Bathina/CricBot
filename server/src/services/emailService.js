import nodemailer from 'nodemailer';

export const DEVELOPER_RECIPIENT_EMAIL = process.env.DEVELOPER_EMAIL || 'saikrishnabathina999@gmail.com';

/**
 * Creates nodemailer transport if credentials exist in .env
 */
function createTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'saikrishnabathina999@gmail.com';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a discrepancy or bug report email to the developer
 */
export async function sendDiscrepancyReportEmail(report) {
  const transporter = createTransporter();

  const subject = `[CricLaws Bug / Law Report] ${report.category.toUpperCase()} - ${report.lawReference || 'General'}`;

  const textContent = `
CRICLAWS LAW DISCREPANCY & BUG REPORT
===================================================
Report ID:      ${report._id || report.id || 'N/A'}
Date & Time:    ${new Date().toLocaleString()}
Category:       ${report.category}
Law Reference:  ${report.lawReference || 'None Specified'}
Reporter Email: ${report.userEmail || 'Anonymous Reporter'}

DESCRIPTION:
${report.description}

MANDATORY PROOF & STATUTORY CITATIONS:
${report.proofEvidence}

===================================================
Sent from CricLaws Official Desk Platform
Developer: Sai Krishna Bathina (saikrishnabathina999@gmail.com)
  `.trim();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #D5E2DA; border-radius: 8px; overflow: hidden; color: #14201A;">
      <div style="background-color: #0F241D; color: #ffffff; padding: 18px 24px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">⚖️ CricLaws Discrepancy &amp; Bug Report</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6ee7b7;">Official Desk Officiating Feedback</p>
      </div>

      <div style="padding: 24px; background-color: #F8FAF9;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #E2ECE5;">
            <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #475569;">Category:</td>
            <td style="padding: 8px 0; color: #0F241D; font-weight: 600;">${report.category}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2ECE5;">
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Law Reference:</td>
            <td style="padding: 8px 0; color: #0F241D;">${report.lawReference || 'Not specified'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2ECE5;">
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Reporter Email:</td>
            <td style="padding: 8px 0; color: #0F241D;">${report.userEmail ? `<a href="mailto:${report.userEmail}">${report.userEmail}</a>` : 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Report ID:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 11px; color: #64748B;">${report._id || report.id || 'N/A'}</td>
          </tr>
        </table>

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">What is Incorrect / Bug Description:</h4>
          <div style="background-color: #ffffff; border: 1px solid #D5E2DA; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.5; color: #1E293B;">
            ${report.description.replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #065F46; letter-spacing: 0.5px;">Mandatory Supporting Proof &amp; Citations:</h4>
          <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.5; color: #064E3B;">
            ${report.proofEvidence.replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div style="font-size: 11px; color: #64748B; border-top: 1px solid #D5E2DA; padding-top: 14px; text-align: center;">
          Received via CricLaws Official Desk • Developed by Sai Krishna Bathina
        </div>
      </div>
    </div>
  `;

  if (!transporter) {
    console.info(`[EmailService] Report ${report._id || ''} saved to database. Automated backend SMTP dispatch skipped because GMAIL_APP_PASSWORD is not set in server/.env.`);
    return {
      sent: false,
      reason: 'NO_SMTP_CREDENTIALS',
      recipient: DEVELOPER_RECIPIENT_EMAIL,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CricLaws Desk" <${process.env.SMTP_USER || process.env.GMAIL_USER || DEVELOPER_RECIPIENT_EMAIL}>`,
      to: DEVELOPER_RECIPIENT_EMAIL,
      replyTo: report.userEmail || undefined,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.info(`[EmailService] Discrepancy email sent successfully to ${DEVELOPER_RECIPIENT_EMAIL}: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId,
      recipient: DEVELOPER_RECIPIENT_EMAIL,
    };
  } catch (err) {
    console.error('[EmailService] Failed to send email via SMTP:', err.message);
    return {
      sent: false,
      error: err.message,
      recipient: DEVELOPER_RECIPIENT_EMAIL,
    };
  }
}
