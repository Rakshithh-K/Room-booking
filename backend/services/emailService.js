const { BrevoClient } = require('@getbrevo/brevo');
const emailConfig = require('../config/emailConfig');
const { formatBookingId } = require('./pdfService');

// Internal client reference allowing mock injection during tests
let brevoClientOverride = null;

/**
 * Configure or mock the Brevo client instance (useful for automated testing)
 */
const setBrevoClient = (client) => {
  brevoClientOverride = client;
};

/**
 * Get configured Brevo client instance
 */
const getBrevoClient = () => {
  if (brevoClientOverride) {
    return brevoClientOverride;
  }

  const apiKey = emailConfig.getBrevoApiKey();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  return new BrevoClient({ apiKey });
};

/**
 * Validate customer email format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Generate responsive HTML email content
 */
const generateEmailHtml = ({
  customerName,
  bookingId,
  roomName,
  roomNumber,
  checkInDate,
  checkInTime,
  checkOutDate,
  checkOutTime,
  totalNights,
  totalAmount,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
}) => {
  const formattedAmount = Number(totalAmount || 0).toLocaleString('en-IN');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Room Booking Confirmed - ${bookingId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left; border-bottom: 4px solid #d97706;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">${businessName}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Room Booking Confirmation</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #1f2937;">
                Hello <strong>${customerName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #4b5563;">
                Your room booking has been confirmed successfully. We are delighted to host your upcoming stay with us.
              </p>

              <!-- Reservation Summary Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background-color: #f1f5f9;">
                    <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Booking Identifier</span>
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">#${bookingId}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b; width: 40%;">Room:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;">${roomName}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">Room Number:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;">Room ${roomNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">Check-in:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;">${checkInDate} at ${checkInTime}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">Check-out:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;">${checkOutDate} at ${checkOutTime}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #64748b;">Duration:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;">${totalNights} ${totalNights === 1 ? 'Night' : 'Nights'}</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 15px; font-weight: 700; color: #0f172a;">Total Amount:</td>
                        <td style="padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 17px; font-weight: 700; color: #b45309;">₹${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 13.5px; line-height: 20px; color: #065f46;">
                      <strong>PDF Attachment:</strong> Your booking confirmation PDF is attached to this email for your records and check-in presentation.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #4b5563;">
                Thank you for choosing <strong>${businessName}</strong>. We look forward to welcoming you.
              </p>

              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 22px; color: #1f2937;">
                Regards,<br>
                <strong>${businessName} Reservations Team</strong>
              </p>
            </td>
          </tr>

          <!-- Contact & Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                Need help or have questions regarding your booking?
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
                Phone: <a href="tel:${businessPhone}" style="color: #d97706; text-decoration: none;">${businessPhone}</a> | Email: <a href="mailto:${businessEmail}" style="color: #d97706; text-decoration: none;">${businessEmail}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                ${businessAddress}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send booking confirmation email with PDF attachment via Brevo HTTPS API
 * @param {Object} booking - Booking mongoose document or object
 * @param {Object} customer - Customer object (name, email, phone)
 * @param {Object} room - Room object (roomNumber, name, type, price)
 * @param {Buffer} pdfBuffer - In-memory PDF Buffer
 * @returns {Promise<{ success: boolean, messageId: string }>}
 */
const sendBookingConfirmationEmail = async (booking, customer, room, pdfBuffer) => {
  if (!booking) {
    throw new Error('Booking information is required to send confirmation email');
  }

  const customerEmail = customer?.email || (booking.user && booking.user.email);
  const customerName = customer?.name || (booking.user && booking.user.name) || 'Valued Guest';

  if (!customerEmail || !isValidEmail(customerEmail)) {
    throw new Error(`Invalid or missing customer email address: "${customerEmail || ''}"`);
  }

  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error('A valid PDF Buffer is required as an attachment');
  }

  const client = getBrevoClient();

  const businessName = emailConfig.getBusinessName();
  const fromEmail = emailConfig.getFromEmail();
  const fromName = emailConfig.getFromName();

  const bookingIdStr = booking._id ? booking._id.toString() : 'Reservation';
  const bookingRef = formatBookingId(bookingIdStr);
  const attachmentFilename = `Booking-${bookingRef}.pdf`;

  const html = generateEmailHtml({
    customerName,
    bookingId: bookingIdStr,
    roomName: room?.name || (booking.room && booking.room.name) || 'Room',
    roomNumber: room?.roomNumber || (booking.room && booking.room.roomNumber) || 'N/A',
    checkInDate: booking.checkInDate || 'N/A',
    checkInTime: booking.checkInTime || '12:00 PM',
    checkOutDate: booking.checkOutDate || 'N/A',
    checkOutTime: booking.checkOutTime || '11:00 AM',
    totalNights: booking.totalNights || 1,
    totalAmount: booking.totalAmount || 0,
    businessName,
    businessPhone: emailConfig.getBusinessPhone(),
    businessEmail: emailConfig.getBusinessEmail(),
    businessAddress: emailConfig.getBusinessAddress(),
  });

  const sendPayload = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: [
      {
        email: customerEmail.trim(),
        name: customerName.trim(),
      },
    ],
    subject: `Room Booking Confirmed - ${bookingRef}`,
    htmlContent: html,
    attachment: [
      {
        name: attachmentFilename,
        content: pdfBuffer.toString('base64'),
      },
    ],
  };

  try {
    const response = await client.transactionalEmails.sendTransacEmail(sendPayload);

    const messageId =
      response?.messageId ||
      (Array.isArray(response?.messageIds) && response.messageIds[0]) ||
      `brevo-${Date.now()}`;

    return {
      success: true,
      messageId: String(messageId),
    };
  } catch (error) {
    const errorMsg =
      error?.response?.body?.message ||
      error?.body?.message ||
      error?.message ||
      'Failed to send transactional email via Brevo';

    throw new Error(`Brevo transactional email failed: ${errorMsg}`);
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  setBrevoClient,
  getBrevoClient,
  isValidEmail,
  generateEmailHtml,
};
