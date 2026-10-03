const Room = require('../models/Room');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/stats
// @access  Admin (logically separated, ready for admin auth)
const getAdminStats = async (req, res, next) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    const soldOutRooms = await Room.countDocuments({ status: 'Sold Out' });
    const totalBookings = await Booking.countDocuments();
    const totalCustomers = await User.countDocuments();

    // Calculate revenue from Confirmed and Completed bookings
    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['Confirmed', 'Completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Get recent 5 bookings
    const recentBookings = await Booking.find()
      .populate('room', 'roomNumber name type price')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        soldOutRooms,
        totalBookings,
        totalCustomers,
        totalRevenue,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for Admin
// @route   GET /api/admin/bookings
// @access  Admin
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('room')
      .populate('user', 'name email phone')
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

const { generateBookingConfirmationPDF } = require('../services/pdfService');
const { sendBookingConfirmationEmail, isValidEmail } = require('../services/emailService');

// @desc    Resend booking confirmation email with generated PDF
// @route   POST /api/admin/bookings/:id/resend-confirmation
// @access  Admin
const resendConfirmationEmail = async (req, res, next) => {
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

    const customer = booking.user;
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not have an associated customer record',
      });
    }

    const room = booking.room;
    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not have an associated room record',
      });
    }

    if (!customer.email || !isValidEmail(customer.email)) {
      booking.emailStatus = 'failed';
      await booking.save();
      return res.status(400).json({
        success: false,
        message: `Customer email address (${customer.email || 'empty'}) is invalid`,
      });
    }

    // 4. Generate fresh PDF Buffer
    let pdfBuffer;
    try {
      pdfBuffer = await generateBookingConfirmationPDF(booking, customer, room);
      booking.confirmationPdfGenerated = true;
      await booking.save();
      console.log(`PDF generated: Booking ID ${booking._id}`);
    } catch (pdfError) {
      booking.confirmationPdfGenerated = false;
      booking.emailStatus = 'failed';
      await booking.save();
      console.error(`PDF generation failed: Booking ID ${booking._id} - ${pdfError.message}`);

      return res.status(500).json({
        success: false,
        message: 'Failed to generate confirmation PDF',
        data: {
          booking,
          emailStatus: 'failed',
        },
      });
    }

    // 5. Send email through Brevo
    try {
      const emailResult = await sendBookingConfirmationEmail(booking, customer, room, pdfBuffer);
      booking.emailStatus = 'sent';
      booking.emailMessageId = emailResult.messageId;
      await booking.save();
      console.log(`Email sent: Booking ID ${booking._id}, Brevo message ID ${emailResult.messageId}`);

      return res.status(200).json({
        success: true,
        message: 'Confirmation email resent successfully',
        data: {
          booking,
          emailStatus: 'sent',
          emailMessageId: emailResult.messageId,
        },
      });
    } catch (emailError) {
      booking.emailStatus = 'failed';
      await booking.save();
      console.error(`Email failed: Booking ID ${booking._id} - ${emailError.message}`);

      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email through Brevo',
        data: {
          booking,
          emailStatus: 'failed',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllBookings,
  resendConfirmationEmail,
};

