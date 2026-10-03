const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { setBrevoClient } = require('../services/emailService');

describe('Booking Flow & Brevo Confirmation Integration Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_room_booking_key_2026_hotel_auth';

  const mockUser = {
    _id: '67a0f1234567890123456789',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    phone: '9988766554',
    role: 'customer',
  };

  const customerToken = jwt.sign({ id: mockUser._id }, JWT_SECRET, { expiresIn: '1h' });

  const mockRoom = {
    _id: '67a0f9876543210987654321',
    roomNumber: '302',
    name: 'Royal Heritage Deluxe',
    type: 'Deluxe',
    description: 'Scenic garden view with premium king bed',
    price: 3500,
    status: 'Available',
    services: ['Wi-Fi', 'AC', 'Breakfast', 'Attached Bathroom'],
  };

  afterEach(() => {
    jest.restoreAllMocks();
    setBrevoClient(null);
  });

  test('1 & 5. Booking creation with successful PDF generation and Brevo email confirmation', async () => {
    const mockMessageId = '<brevo-success-message-id-101@smtp.brevo.com>';
    let brevoCalled = false;

    // Mock User lookup in auth middleware
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    // Mock Room lookup
    jest.spyOn(Room, 'findById').mockResolvedValue(mockRoom);

    // Mock Booking document
    const createdDoc = {
      _id: '67a0faabbccddeeff0011223',
      user: mockUser._id,
      room: mockRoom._id,
      checkInDate: '2026-11-10',
      checkInTime: '01:00 PM',
      checkOutDate: '2026-11-13',
      checkOutTime: '11:00 AM',
      totalNights: 3,
      totalAmount: 10500,
      status: 'Confirmed',
      emailStatus: 'pending',
      confirmationPdfGenerated: false,
      emailMessageId: null,
      save: jest.fn().mockResolvedValue(true),
    };

    const populatedDoc = {
      ...createdDoc,
      user: mockUser,
      room: mockRoom,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };

    jest.spyOn(Booking, 'create').mockResolvedValue(createdDoc);
    jest.spyOn(Booking, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedDoc),
      }),
    });

    // Mock Brevo client
    setBrevoClient({
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockImplementation(async (payload) => {
          brevoCalled = true;
          expect(payload.to[0].email).toBe(mockUser.email);
          expect(payload.attachment).toBeDefined();
          expect(payload.attachment[0].content).toBeDefined();
          return { messageId: mockMessageId };
        }),
      },
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: mockRoom._id,
        checkInDate: '2026-11-10',
        checkInTime: '01:00 PM',
        checkOutDate: '2026-11-13',
        checkOutTime: '11:00 AM',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Booking confirmed successfully');
    expect(res.body.data.emailStatus).toBe('sent');
    expect(res.body.data.booking).toBeDefined();

    // Verify PDF was generated and email status updated
    expect(populatedDoc.confirmationPdfGenerated).toBe(true);
    expect(populatedDoc.emailStatus).toBe('sent');
    expect(populatedDoc.emailMessageId).toBe(mockMessageId);
    expect(brevoCalled).toBe(true);
  });

  test('6 & 7. Booking persistence and graceful degradation when Brevo email fails', async () => {
    // Mock User lookup in auth middleware
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    // Mock Room lookup
    jest.spyOn(Room, 'findById').mockResolvedValue(mockRoom);

    let deleteCalled = false;
    const populatedDoc = {
      _id: '67a0faabbccddeeff0011224',
      user: mockUser,
      room: mockRoom,
      checkInDate: '2026-11-15',
      checkInTime: '02:00 PM',
      checkOutDate: '2026-11-17',
      checkOutTime: '11:00 AM',
      totalNights: 2,
      totalAmount: 7000,
      status: 'Confirmed',
      emailStatus: 'pending',
      confirmationPdfGenerated: false,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
      deleteOne: jest.fn().mockImplementation(() => {
        deleteCalled = true;
      }),
    };

    jest.spyOn(Booking, 'create').mockResolvedValue(populatedDoc);
    jest.spyOn(Booking, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedDoc),
      }),
    });
    jest.spyOn(Booking, 'findByIdAndDelete').mockImplementation(() => {
      deleteCalled = true;
    });

    // Mock failing Brevo client
    setBrevoClient({
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockImplementation(async () => {
          const err = new Error('Service Unavailable');
          err.response = { body: { message: 'Brevo transactional email API temporarily down' } };
          throw err;
        }),
      },
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomId: mockRoom._id,
        checkInDate: '2026-11-15',
        checkInTime: '02:00 PM',
        checkOutDate: '2026-11-17',
        checkOutTime: '11:00 AM',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Booking confirmed, but confirmation email could not be sent');
    expect(res.body.data.emailStatus).toBe('failed');

    // CRITICAL REQUIREMENT: Verify booking was NOT deleted or rolled back
    expect(deleteCalled).toBe(false);
    expect(populatedDoc.status).toBe('Confirmed');
    expect(populatedDoc.confirmationPdfGenerated).toBe(true);
    expect(populatedDoc.emailStatus).toBe('failed');
  });

  test('8. Resend confirmation email via POST /api/admin/bookings/:id/resend-confirmation', async () => {
    const existingBookingDoc = {
      _id: '67a0faabbccddeeff0011225',
      user: mockUser,
      room: mockRoom,
      checkInDate: '2026-11-20',
      checkInTime: '12:00 PM',
      checkOutDate: '2026-11-22',
      checkOutTime: '11:00 AM',
      totalNights: 2,
      totalAmount: 7000,
      status: 'Confirmed',
      emailStatus: 'failed',
      confirmationPdfGenerated: false,
      emailMessageId: null,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };

    jest.spyOn(Booking, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(existingBookingDoc),
      }),
    });

    const createSpy = jest.spyOn(Booking, 'create');

    const resendMsgId = '<brevo-resent-msg-777@smtp.brevo.com>';
    setBrevoClient({
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockResolvedValue({ messageId: resendMsgId }),
      },
    });

    const res = await request(app)
      .post(`/api/admin/bookings/${existingBookingDoc._id}/resend-confirmation`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Confirmation email resent successfully');
    expect(res.body.data.emailStatus).toBe('sent');
    expect(res.body.data.emailMessageId).toBe(resendMsgId);

    // Verify document was updated
    expect(existingBookingDoc.emailStatus).toBe('sent');
    expect(existingBookingDoc.confirmationPdfGenerated).toBe(true);
    expect(existingBookingDoc.emailMessageId).toBe(resendMsgId);

    // CRITICAL REQUIREMENT: Verify NO duplicate bookings were created
    expect(createSpy).not.toHaveBeenCalled();
  });

  test('8b. Resend confirmation email handles Brevo failure on resend gracefully', async () => {
    const existingBookingDoc = {
      _id: '67a0faabbccddeeff0011226',
      user: mockUser,
      room: mockRoom,
      checkInDate: '2026-11-20',
      checkInTime: '12:00 PM',
      checkOutDate: '2026-11-22',
      checkOutTime: '11:00 AM',
      totalNights: 2,
      totalAmount: 7000,
      status: 'Confirmed',
      emailStatus: 'pending',
      confirmationPdfGenerated: false,
      emailMessageId: null,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };

    jest.spyOn(Booking, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(existingBookingDoc),
      }),
    });

    // Mock failing Brevo client
    setBrevoClient({
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
      },
    });

    const res = await request(app)
      .post(`/api/admin/bookings/${existingBookingDoc._id}/resend-confirmation`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Failed to send confirmation email through Brevo');
    expect(existingBookingDoc.emailStatus).toBe('failed');
  });
});
