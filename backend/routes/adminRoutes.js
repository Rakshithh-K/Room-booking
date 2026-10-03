const express = require('express');
const router = express.Router();
const { getAdminStats, getAllBookings, resendConfirmationEmail } = require('../controllers/adminController');
const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  updateRoomPrice,
} = require('../controllers/roomController');
const { updateBookingStatus } = require('../controllers/bookingController');

// Admin Stats
router.get('/stats', getAdminStats);

// Admin Room Management
router.route('/rooms')
  .get(getRooms)
  .post(createRoom);

router.route('/rooms/:id')
  .put(updateRoom)
  .delete(deleteRoom);

router.patch('/rooms/:id/status', updateRoomStatus);
router.patch('/rooms/:id/price', updateRoomPrice);

// Admin Booking Management
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/resend-confirmation', resendConfirmationEmail);

module.exports = router;

