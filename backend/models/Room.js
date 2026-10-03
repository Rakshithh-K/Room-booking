const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide room name'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please provide room type'],
      trim: true,
      enum: ['Standard', 'Deluxe', 'Premium', 'Family', 'Suite', 'Executive'],
      default: 'Deluxe',
    },
    description: {
      type: String,
      required: [true, 'Please provide room description'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide room price per night'],
      min: [0, 'Price must be positive'],
    },
    status: {
      type: String,
      enum: ['Available', 'Sold Out'],
      default: 'Available',
    },
    services: {
      type: [String],
      default: ['Wi-Fi', 'AC', 'TV', 'Attached Bathroom', 'Room Service'],
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', roomSchema);
