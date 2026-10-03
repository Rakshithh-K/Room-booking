const PDFDocument = require('pdfkit');
const emailConfig = require('../config/emailConfig');

/**
 * Format currency as standard INR / Rs string for PDFKit
 * Standard PDF fonts like Helvetica reliably support 'INR' or 'Rs.'
 */
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `INR ${num.toLocaleString('en-IN')}`;
};

/**
 * Cleanly format booking reference ID
 */
const formatBookingId = (bookingId) => {
  if (!bookingId) return 'N/A';
  const str = bookingId.toString();
  return str.length > 8 ? `BK-${str.slice(-6).toUpperCase()}` : str;
};

/**
 * Generate a professional in-memory PDF confirmation document
 * @param {Object} booking - Booking mongoose document or object
 * @param {Object} customer - Customer object (name, email, phone)
 * @param {Object} room - Room object (roomNumber, name, type, price, services)
 * @returns {Promise<Buffer>} Resolves to a PDF Buffer
 */
const generateBookingConfirmationPDF = (booking, customer, room) => {
  return new Promise((resolve, reject) => {
    try {
      if (!booking) {
        return reject(new Error('Booking details are required to generate PDF'));
      }

      const businessName = emailConfig.getBusinessName();
      const businessPhone = emailConfig.getBusinessPhone();
      const businessEmail = emailConfig.getBusinessEmail();
      const businessAddress = emailConfig.getBusinessAddress();

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Booking Confirmation - ${booking._id || 'Reservation'}`,
          Author: businessName,
          Subject: 'Room Booking Confirmation',
          Creator: `${businessName} System`,
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1e293b'; // Slate 800
      const accentColor = '#b45309';  // Amber 700
      const successColor = '#047857'; // Emerald 700
      const mutedColor = '#64748b';   // Slate 500
      const borderColor = '#cbd5e1'; // Slate 300
      const cardBg = '#f8fafc';      // Slate 50

      const pageWidth = 595.28;
      const contentWidth = pageWidth - 80; // 40 margin each side = 515.28
      let y = 40;

      // ----------------- HEADER -----------------
      // Business Name
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(primaryColor)
        .text(businessName.toUpperCase(), 40, y, { align: 'left' });

      // Title Subheading
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(accentColor)
        .text('ROOM BOOKING CONFIRMATION', 40, y + 28, {
          characterSpacing: 1.2,
        });

      // Header right-side info
      const bookingRef = formatBookingId(booking._id);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(primaryColor)
        .text(`Ref: ${bookingRef}`, 350, y + 5, { width: 205, align: 'right' });

      const bookingDateStr = booking.createdAt
        ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(mutedColor)
        .text(`Issued: ${bookingDateStr}`, 350, y + 22, { width: 205, align: 'right' });

      y += 56;

      // Accent Divider
      doc
        .strokeColor(accentColor)
        .lineWidth(2.5)
        .moveTo(40, y)
        .lineTo(pageWidth - 40, y)
        .stroke();

      y += 18;

      // ----------------- BOOKING & STAY HIGHLIGHT BANNER -----------------
      doc
        .rect(40, y, contentWidth, 54)
        .fillAndStroke('#fffbeb', '#fde68a'); // Light amber box

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#92400e')
        .text('RESERVATION STATUS', 55, y + 10);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(successColor)
        .text('BOOKING CONFIRMED', 55, y + 25);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#78350f')
        .text(`Booking ID: #${booking._id?.toString() || 'N/A'}`, 260, y + 13, {
          width: 280,
          align: 'right',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryColor)
        .text(
          `Total: ${formatCurrency(booking.totalAmount)}`,
          260,
          y + 28,
          { width: 280, align: 'right' }
        );

      y += 70;

      // ----------------- 2-COLUMN SECTION: CUSTOMER & ROOM -----------------
      const colWidth = (contentWidth - 15) / 2; // ~250
      const col1X = 40;
      const col2X = 40 + colWidth + 15;

      // Column 1: Customer Details
      doc
        .rect(col1X, y, colWidth, 120)
        .fillAndStroke(cardBg, borderColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryColor)
        .text('CUSTOMER DETAILS', col1X + 12, y + 12);

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(col1X + 12, y + 28)
        .lineTo(col1X + colWidth - 12, y + 28)
        .stroke();

      const custName = customer?.name || (booking.user && booking.user.name) || 'Valued Guest';
      const custPhone = customer?.phone || (booking.user && booking.user.phone) || 'N/A';
      const custEmail = customer?.email || (booking.user && booking.user.email) || 'N/A';

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Customer Name', col1X + 12, y + 36);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text(custName, col1X + 12, y + 48, { width: colWidth - 24 });

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Phone Number', col1X + 12, y + 64);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(custPhone, col1X + 12, y + 76);

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Email Address', col1X + 12, y + 92);
      doc.font('Helvetica').fontSize(9).fillColor(primaryColor).text(custEmail, col1X + 12, y + 104, { width: colWidth - 24 });

      // Column 2: Room Details
      const roomNumber = room?.roomNumber || (booking.room && booking.room.roomNumber) || 'N/A';
      const roomName = room?.name || (booking.room && booking.room.name) || 'Standard Room';
      const roomType = room?.type || (booking.room && booking.room.type) || 'Deluxe';
      const rawServices = room?.services || (booking.room && booking.room.services) || [];
      const servicesStr = Array.isArray(rawServices)
        ? rawServices.join(', ')
        : (typeof rawServices === 'string' ? rawServices : 'Standard Amenities');

      doc
        .rect(col2X, y, colWidth, 120)
        .fillAndStroke(cardBg, borderColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryColor)
        .text('ROOM DETAILS', col2X + 12, y + 12);

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(col2X + 12, y + 28)
        .lineTo(col2X + colWidth - 12, y + 28)
        .stroke();

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Room Name & Number', col2X + 12, y + 36);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text(`${roomName} (Room ${roomNumber})`, col2X + 12, y + 48, { width: colWidth - 24 });

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Room Type', col2X + 12, y + 64);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(accentColor).text(roomType, col2X + 12, y + 76);

      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Included Services', col2X + 12, y + 92);
      doc.font('Helvetica').fontSize(8.5).fillColor(primaryColor).text(servicesStr, col2X + 12, y + 104, { width: colWidth - 24, height: 20, ellipsis: true });

      y += 134;

      // ----------------- STAY DETAILS -----------------
      doc
        .rect(40, y, contentWidth, 80)
        .fillAndStroke(cardBg, borderColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryColor)
        .text('STAY DETAILS', 52, y + 12);

      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(52, y + 27)
        .lineTo(pageWidth - 52, y + 27)
        .stroke();

      const stayColWidth = (contentWidth - 24) / 3;

      // Check-in
      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Check-in Date & Time', 52, y + 35);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(primaryColor)
        .text(booking.checkInDate || 'N/A', 52, y + 48);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(mutedColor)
        .text(`at ${booking.checkInTime || '12:00 PM'}`, 52, y + 61);

      // Check-out
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(mutedColor)
        .text('Check-out Date & Time', 52 + stayColWidth, y + 35);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(primaryColor)
        .text(booking.checkOutDate || 'N/A', 52 + stayColWidth, y + 48);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(mutedColor)
        .text(`at ${booking.checkOutTime || '11:00 AM'}`, 52 + stayColWidth, y + 61);

      // Duration
      const nights = booking.totalNights || 1;
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(mutedColor)
        .text('Duration of Stay', 52 + stayColWidth * 2, y + 35);
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(accentColor)
        .text(`${nights} ${nights === 1 ? 'Night' : 'Nights'}`, 52 + stayColWidth * 2, y + 48);

      y += 94;

      // ----------------- PAYMENT / PRICE SUMMARY -----------------
      doc
        .rect(40, y, contentWidth, 120)
        .fillAndStroke('#ffffff', borderColor);

      doc
        .rect(40, y, contentWidth, 26)
        .fill(primaryColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#ffffff')
        .text('PAYMENT / PRICE SUMMARY', 52, y + 8);

      const tableY = y + 36;
      const roomPrice = (room?.price) || (booking.totalAmount && nights ? Math.round(booking.totalAmount / nights) : 0);

      // Line 1: Room Price
      doc.font('Helvetica').fontSize(9.5).fillColor(primaryColor).text('Room Rate per Night', 52, tableY);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(formatCurrency(roomPrice), 400, tableY, { width: 140, align: 'right' });

      // Line 2: Nights
      doc.font('Helvetica').fontSize(9.5).fillColor(primaryColor).text('Number of Nights', 52, tableY + 18);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(`${nights}`, 400, tableY + 18, { width: 140, align: 'right' });

      // Divider
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(52, tableY + 36)
        .lineTo(pageWidth - 52, tableY + 36)
        .stroke();

      // Line 3: Total Amount
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('Total Amount', 52, tableY + 44);
      doc.font('Helvetica-Bold').fontSize(13).fillColor(accentColor).text(formatCurrency(booking.totalAmount), 400, tableY + 42, { width: 140, align: 'right' });

      doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor).text('Payment Status: Paid / Guaranteed at reservation', 52, tableY + 62);

      y += 134;

      // ----------------- FINAL STATUS BADGE -----------------
      doc
        .rect(40, y, contentWidth, 42)
        .fillAndStroke('#ecfdf5', '#a7f3d0'); // Light green badge

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(successColor)
        .text('FINAL STATUS: BOOKING CONFIRMED', 40, y + 14, {
          align: 'center',
          characterSpacing: 0.8,
        });

      y += 56;

      // ----------------- FOOTER & CONTACT -----------------
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(40, y)
        .lineTo(pageWidth - 40, y)
        .stroke();

      y += 10;

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(primaryColor)
        .text(`Thank you for choosing ${businessName}!`, 40, y, { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(mutedColor)
        .text(
          `For assistance or changes to your reservation, contact: ${businessPhone} | ${businessEmail}`,
          40,
          y + 12,
          { align: 'center' }
        );

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#94a3b8')
        .text(
          `${businessAddress} - Generated electronically on ${new Date().toISOString()}`,
          40,
          y + 24,
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateBookingConfirmationPDF,
  formatBookingId,
};
