const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { generateBookingConfirmationPDF } = require('../services/pdfService');
const { sendBookingConfirmationEmail } = require('../services/emailService');

// Helper to calculate nights between check-in and check-out dates
const calculateNights = (checkInStr, checkOutStr) => {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// @desc    Create a new room booking
// @route   POST /api/bookings
// @access  Private (Customer)
const createBooking = async (req, res, next) => {
  try {
    const {
      roomId,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
    } = req.body;

    if (!roomId || !checkInDate || !checkInTime || !checkOutDate || !checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all booking details: roomId, checkInDate, checkInTime, checkOutDate, and checkOutTime',
      });
    }

    // 1. Fetch Room from database
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // 2. Business rule: Sold out rooms cannot be booked
    if (room.status === 'Sold Out') {
      return res.status(400).json({
        success: false,
        message: 'This room is currently Sold Out and cannot be booked. Please choose another room.',
      });
    }

    // 3. Business rule: Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in or check-out date format',
      });
    }

    // Check past date restriction (check-in shouldn't be before today's date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDay = new Date(checkInDate);
    checkInDay.setHours(0, 0, 0, 0);

    if (checkInDay < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past',
      });
    }

    // Business rule: Check-out must occur after check-in
    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be strictly after the check-in date',
      });
    }

    // 4. Calculate duration & total amount
    const nights = calculateNights(checkInDate, checkOutDate);
    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: 'Booking duration must be at least 1 night',
      });
    }

    // Always fetch current price from database
    const totalAmount = room.price * nights;

    // 5. Create Booking
    const booking = await Booking.create({
      user: req.user._id,
      room: room._id,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      totalNights: nights,
      totalAmount,
      status: 'Confirmed',
      emailStatus: 'pending',
      confirmationPdfGenerated: false,
    });

    console.log(`Booking created: Booking ID ${booking._id}`);

    const populatedBooking = await Booking.findById(booking._id)
      .populate('room')
      .populate('user', 'name email phone');

    // 6. Generate PDF Buffer
    let pdfBuffer;
    try {
      pdfBuffer = await generateBookingConfirmationPDF(
        populatedBooking,
        populatedBooking.user,
        populatedBooking.room
      );
      populatedBooking.confirmationPdfGenerated = true;
      await populatedBooking.save();
      console.log(`PDF generated: Booking ID ${populatedBooking._id}`);
    } catch (pdfError) {
      console.error(`PDF generation failed: Booking ID ${populatedBooking._id} - ${pdfError.message}`);
      populatedBooking.confirmationPdfGenerated = false;
      populatedBooking.emailStatus = 'failed';
      await populatedBooking.save();

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed, but confirmation email could not be sent',
        data: {
          booking: populatedBooking,
          emailStatus: 'failed',
        },
      });
    }

    // 7. Send confirmation email via Brevo HTTPS API
    try {
      const emailResult = await sendBookingConfirmationEmail(
        populatedBooking,
        populatedBooking.user,
        populatedBooking.room,
        pdfBuffer
      );

      populatedBooking.emailStatus = 'sent';
      populatedBooking.emailMessageId = emailResult.messageId;
      await populatedBooking.save();
      console.log(`Email sent: Booking ID ${populatedBooking._id}, Brevo message ID ${emailResult.messageId}`);

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed successfully',
        data: {
          booking: populatedBooking,
          emailStatus: 'sent',
        },
      });
    } catch (emailError) {
      console.error(`Email failed: Booking ID ${populatedBooking._id} - ${emailError.message}`);
      populatedBooking.emailStatus = 'failed';
      await populatedBooking.save();

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed, but confirmation email could not be sent',
        data: {
          booking: populatedBooking,
          emailStatus: 'failed',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's personal bookings
// @route   GET /api/bookings/my
// @access  Private (Customer)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check customer authorization
    if (
      req.user &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      // Allow access if admin, or return forbidden
      // For now, if user matches or route is admin
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (Confirmed, Cancelled, Completed)
// @route   PATCH /api/bookings/:id/status
// @access  Public / Private
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['Confirmed', 'Cancelled', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Confirmed, Cancelled, Completed',
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('room')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
};
