const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  updateRoomPrice,
} = require('../controllers/roomController');

router.route('/')
  .get(getRooms)
  .post(createRoom);

router.route('/:id')
  .get(getRoomById)
  .put(updateRoom)
  .delete(deleteRoom);

router.patch('/:id/status', updateRoomStatus);
router.patch('/:id/price', updateRoomPrice);

module.exports = router;
