const { generateBookingConfirmationPDF, formatBookingId } = require('../services/pdfService');
const {
  sendBookingConfirmationEmail,
  setBrevoClient,
  isValidEmail,
  generateEmailHtml,
} = require('../services/emailService');

describe('PDF Service & Buffer Validity Tests', () => {
  const mockBooking = {
    _id: '6ac0ab128931c3f0a5229a4a',
    checkInDate: '2026-10-15',
    checkInTime: '02:00 PM',
    checkOutDate: '2026-10-18',
    checkOutTime: '11:00 AM',
    totalNights: 3,
    totalAmount: 10500,
    status: 'Confirmed',
    createdAt: new Date('2026-10-03T10:00:00Z'),
  };

  const mockCustomer = {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 12345',
  };

  const mockRoom = {
    roomNumber: '204',
    name: 'Presidential Deluxe Suite',
    type: 'Deluxe',
    price: 3500,
    services: ['High-speed Wi-Fi', 'AC', 'Smart TV', 'Attached Bathroom', 'Complimentary Breakfast'],
  };

  test('formatBookingId formats reference cleanly', () => {
    const formatted = formatBookingId(mockBooking._id);
    expect(formatted).toBe('BK-229A4A');
  });

  test('generateBookingConfirmationPDF generates a valid PDF Buffer', async () => {
    const pdfBuffer = await generateBookingConfirmationPDF(mockBooking, mockCustomer, mockRoom);

    // Verify it is an instance of Buffer
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);

    // Verify minimum non-trivial PDF size
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Verify PDF Magic Bytes (%PDF-) at the start of buffer
    const magicBytes = pdfBuffer.slice(0, 5).toString('ascii');
    expect(magicBytes).toBe('%PDF-');

    // Verify standard PDF EOF marker at the end
    const tail = pdfBuffer.slice(-1024).toString('binary');
    expect(tail).toContain('%%EOF');
  });

  test('generateBookingConfirmationPDF rejects when booking data is missing', async () => {
    await expect(generateBookingConfirmationPDF(null, mockCustomer, mockRoom)).rejects.toThrow(
      'Booking details are required to generate PDF'
    );
  });
});

describe('Email Service & Brevo HTTPS Integration Tests', () => {
  const mockBooking = {
    _id: '6ac0ab128931c3f0a5229a4a',
    checkInDate: '2026-10-15',
    checkInTime: '02:00 PM',
    checkOutDate: '2026-10-18',
    checkOutTime: '11:00 AM',
    totalNights: 3,
    totalAmount: 10500,
  };

  const mockCustomer = {
    name: 'Pooja Verma',
    email: 'pooja.verma@example.com',
    phone: '+91 98111 22334',
  };

  const mockRoom = {
    roomNumber: '108',
    name: 'Executive King Room',
    type: 'Executive',
    price: 3500,
  };

  const dummyPdfBuffer = Buffer.from('%PDF-1.4 mock pdf content for testing %%EOF');

  afterEach(() => {
    // Reset mock client after each test
    setBrevoClient(null);
  });

  test('isValidEmail correctly identifies valid and invalid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('customer.name+tag@sub.domain.co')).toBe(true);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  test('generateEmailHtml contains necessary booking details and responsive markup', () => {
    const html = generateEmailHtml({
      customerName: 'Pooja Verma',
      bookingId: '6ac0ab128931c3f0a5229a4a',
      roomName: 'Executive King Room',
      roomNumber: '108',
      checkInDate: '2026-10-15',
      checkInTime: '02:00 PM',
      checkOutDate: '2026-10-18',
      checkOutTime: '11:00 AM',
      totalNights: 3,
      totalAmount: 10500,
      businessName: 'Shree Lodge Hotel',
      businessPhone: '+91 98765 43210',
      businessEmail: 'reservations@shreelodge.com',
      businessAddress: 'Bengaluru, India',
    });

    expect(html).toContain('Pooja Verma');
    expect(html).toContain('Executive King Room');
    expect(html).toContain('Room 108');
    expect(html).toContain('2026-10-15');
    expect(html).toContain('2026-10-18');
    expect(html).toContain('10,500');
    expect(html).toContain('Shree Lodge Hotel');
    expect(html).toContain('PDF Attachment');
  });

  test('sendBookingConfirmationEmail validates customer email before calling Brevo', async () => {
    const invalidCustomer = { name: 'Nobody', email: 'invalid-email-address' };

    await expect(
      sendBookingConfirmationEmail(mockBooking, invalidCustomer, mockRoom, dummyPdfBuffer)
    ).rejects.toThrow('Invalid or missing customer email address');
  });

  test('sendBookingConfirmationEmail validates PDF buffer before calling Brevo', async () => {
    await expect(
      sendBookingConfirmationEmail(mockBooking, mockCustomer, mockRoom, null)
    ).rejects.toThrow('A valid PDF Buffer is required as an attachment');

    await expect(
      sendBookingConfirmationEmail(mockBooking, mockCustomer, mockRoom, Buffer.alloc(0))
    ).rejects.toThrow('A valid PDF Buffer is required as an attachment');
  });

  test('sendBookingConfirmationEmail handles successful Brevo response', async () => {
    let capturedPayload = null;

    // Create mock Brevo client
    const mockBrevoClient = {
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockImplementation(async (payload) => {
          capturedPayload = payload;
          return { messageId: '<brevo-txn-success-msg-999@smtp-relay.mailin.fr>' };
        }),
      },
    };

    setBrevoClient(mockBrevoClient);

    const result = await sendBookingConfirmationEmail(
      mockBooking,
      mockCustomer,
      mockRoom,
      dummyPdfBuffer
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('<brevo-txn-success-msg-999@smtp-relay.mailin.fr>');

    // Check payload structure
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.to[0].email).toBe('pooja.verma@example.com');
    expect(capturedPayload.to[0].name).toBe('Pooja Verma');
    expect(capturedPayload.subject).toContain('Room Booking Confirmed - BK-229A4A');

    // Verify Base64 encoded attachment
    expect(Array.isArray(capturedPayload.attachment)).toBe(true);
    expect(capturedPayload.attachment[0].name).toBe('Booking-BK-229A4A.pdf');
    expect(capturedPayload.attachment[0].content).toBe(dummyPdfBuffer.toString('base64'));
  });

  test('sendBookingConfirmationEmail handles Brevo failure gracefully with controlled error', async () => {
    // Create failing mock Brevo client
    const mockFailingBrevoClient = {
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockImplementation(async () => {
          const apiError = new Error('Unauthorized: Invalid API Key');
          apiError.response = { body: { message: 'Key not registered on Brevo platform' } };
          throw apiError;
        }),
      },
    };

    setBrevoClient(mockFailingBrevoClient);

    await expect(
      sendBookingConfirmationEmail(mockBooking, mockCustomer, mockRoom, dummyPdfBuffer)
    ).rejects.toThrow('Brevo transactional email failed: Key not registered on Brevo platform');
  });
});
