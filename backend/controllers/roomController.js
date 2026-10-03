const Room = require('../models/Room');

// @desc    Get all rooms (supports filter by status, type, search)
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(query).sort({ roomNumber: 1 });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }
    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new room
// @route   POST /api/rooms or POST /api/admin/rooms
// @access  Public (or Admin later)
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, name, type, description, price, status, services, image } = req.body;

    if (!roomNumber || !name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomNumber, name, description, and price',
      });
    }

    const existingRoom = await Room.findOne({ roomNumber: roomNumber.trim() });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room with number ${roomNumber} already exists`,
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      name: name.trim(),
      type: type || 'Deluxe',
      description: description.trim(),
      price: Number(price),
      status: status || 'Available',
      services: Array.isArray(services) ? services : (services ? services.split(',').map(s => s.trim()) : []),
      image: image || '',
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details
// @route   PUT /api/rooms/:id or PUT /api/admin/rooms/:id
// @access  Public (or Admin later)
const updateRoom = async (req, res, next) => {
  try {
    let room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if new roomNumber collides with another room
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const duplicate = await Room.findOne({
        roomNumber: req.body.roomNumber,
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Room number ${req.body.roomNumber} is already taken`,
        });
      }
    }

    if (req.body.services && typeof req.body.services === 'string') {
      req.body.services = req.body.services.split(',').map((s) => s.trim());
    }

    room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id or DELETE /api/admin/rooms/:id
// @access  Public (or Admin later)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room availability status
// @route   PATCH /api/rooms/:id/status
// @access  Public (or Admin later)
const updateRoomStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['Available', 'Sold Out'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Available" or "Sold Out"',
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Room status updated to ${status}`,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room price
// @route   PATCH /api/rooms/:id/price
// @access  Public (or Admin later)
const updateRoomPrice = async (req, res, next) => {
  try {
    const { price } = req.body;
    const numPrice = Number(price);

    if (price === undefined || isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid non-negative price',
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { price: numPrice },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Room price updated to ₹${numPrice}`,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  updateRoomPrice,
};
