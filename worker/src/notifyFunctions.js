import { sendEmailViaResend } from "./email.js";

const ADMIN_EMAIL = "acadcoachingcenter@gmail.com";

function wrap(headerColor, headerText, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: ${headerColor}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${headerText}</h1>
      </div>
      <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        ${bodyHtml}
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px;">
        © ACAD Education Platform
      </div>
    </div>
  `;
}

async function sendInquiryAlertEmail(env, body) {
  const { studentName, parentName, email, phone, gradeClass, subjects, message } = body;
  if (!studentName || !email) throw new Error("Missing student name or email");

  const html = wrap(
    "#1565C0",
    "New Student Registration Inquiry",
    `
    <p>A new registration inquiry has been received. Details below:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc; width: 160px;">Student Name</td><td style="padding: 8px;">${studentName}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Parent Name</td><td style="padding: 8px;">${parentName || "Not provided"}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Email</td><td style="padding: 8px;">${email}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Phone</td><td style="padding: 8px;">${phone}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Class</td><td style="padding: 8px;">${gradeClass}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Subjects</td><td style="padding: 8px;">${subjects && subjects.length ? subjects.join(", ") : "Not specified"}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Message</td><td style="padding: 8px;">${message || "None"}</td></tr>
    </table>
    <div style="background: #f0f7ff; border-left: 4px solid #1565C0; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Next steps:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Contact the parent/student on ${phone}</li>
        <li>Review the inquiry in Admin Dashboard &gt; Inquiries</li>
        <li>Invite the user to the platform if not yet registered</li>
      </ul>
    </div>
    <p style="margin-top: 24px;">Best regards,<br><strong>ACAD Notification System</strong></p>
  `
  );

  return sendEmailViaResend(env, {
    to: ADMIN_EMAIL,
    subject: `New Registration Inquiry - ${studentName}`,
    html,
  });
}

async function sendTutorApprovalEmail(env, body) {
  const { tutorName, tutorEmail, subjects } = body;
  if (!tutorEmail || !tutorName) throw new Error("Missing tutor name or email");

  const html = wrap(
    "#1565C0",
    "ACAD — Home Tutor Profile Approved",
    `
    <p>Dear <strong>${tutorName}</strong>,</p>
    <p>Great news! Your home tutor profile on ACAD has been <strong style="color: #16a34a;">approved</strong>.</p>
    <p>You are now visible to students and parents searching for tutors near you.</p>
    ${subjects && subjects.length ? `<p><strong>Subjects listed:</strong> ${subjects.join(", ")}</p>` : ""}
    <div style="background: #f0f7ff; border-left: 4px solid #1565C0; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Next steps:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Log in to your ACAD dashboard to manage your profile</li>
        <li>Keep your availability and subjects up to date</li>
        <li>Respond promptly to student interest requests</li>
      </ul>
    </div>
    <p>If you have any questions, reply to this email.</p>
    <p style="margin-top: 24px;">Best regards,<br><strong>Team ACAD</strong></p>
  `
  );

  return sendEmailViaResend(env, {
    to: tutorEmail,
    subject: "Your ACAD Home Tutor Profile is Approved!",
    html,
    replyTo: ADMIN_EMAIL,
  });
}

async function sendPaymentAlertEmail(env, body) {
  const { buyerName, buyerEmail, itemTitle, amountPaid, paymentProofUrl, itemType, transactionId } = body;
  if (!buyerEmail || !itemTitle) throw new Error("Missing buyer email or item title");

  const html = wrap(
    "#15803d",
    "New Payment Submission Received",
    `
    <p>A new payment proof has been submitted and is awaiting your verification.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc; width: 160px;">Buyer Name</td><td style="padding: 8px;">${buyerName || "Not provided"}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Buyer Email</td><td style="padding: 8px;">${buyerEmail}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Item Type</td><td style="padding: 8px;">${itemType || "Purchase"}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Item / Title</td><td style="padding: 8px;">${itemTitle}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Amount Paid</td><td style="padding: 8px;">Rs. ${amountPaid || 0}</td></tr>
      ${transactionId ? `<tr><td style="padding: 8px; font-weight: bold; background: #f8fafc;">Transaction ID</td><td style="padding: 8px;">${transactionId}</td></tr>` : ""}
    </table>
    ${paymentProofUrl ? `<p><strong>Payment Proof:</strong> <a href="${paymentProofUrl}" target="_blank" rel="noopener noreferrer" style="color: #1565C0;">View Screenshot</a></p>` : ""}
    <div style="background: #f0fdf4; border-left: 4px solid #15803d; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Action required:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Verify the payment proof against your payment gateway</li>
        <li>Approve or reject the submission in the admin dashboard</li>
        <li>Buyer will be notified once approved</li>
      </ul>
    </div>
    <p style="margin-top: 24px;">Best regards,<br><strong>ACAD Notification System</strong></p>
  `
  );

  return sendEmailViaResend(env, {
    to: ADMIN_EMAIL,
    subject: `Payment Alert - ${itemTitle} (Rs. ${amountPaid || 0})`,
    html,
  });
}

const NOTIFY_FUNCTIONS = {
  sendInquiryAlertEmail,
  sendTutorApprovalEmail,
  sendPaymentAlertEmail,
};

export async function invokeNotifyFunction(env, name, body) {
  const fn = NOTIFY_FUNCTIONS[name];
  if (!fn) throw new Error(`Unknown function: ${name}`);
  const result = await fn(env, body);
  return { success: true, messageId: result?.id };
}
