const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Booking must specify a room'],
    },
    checkInDate: {
      type: String,
      required: [true, 'Please provide check-in date'],
    },
    checkInTime: {
      type: String,
      required: [true, 'Please provide check-in time'],
    },
    checkOutDate: {
      type: String,
      required: [true, 'Please provide check-out date'],
    },
    checkOutTime: {
      type: String,
      required: [true, 'Please provide check-out time'],
    },
    totalNights: {
      type: Number,
      default: 1,
      min: [1, 'Minimum booking duration is 1 night'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Please provide total booking amount'],
      min: [0, 'Total amount must be positive'],
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Completed'],
      default: 'Confirmed',
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    emailMessageId: {
      type: String,
      default: null,
    },
    confirmationPdfGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
