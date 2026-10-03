const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('../models/Room');
const User = require('../models/User');
const Booking = require('../models/Booking');

dotenv.config({ path: __dirname + '/../.env' });

const sampleRooms = [
  {
    roomNumber: '101',
    name: 'Deluxe Room',
    type: 'Deluxe',
    description: 'Elegant room with king bed, pool view, high-speed Wi-Fi, and premium hotel amenities.',
    price: 2500,
    status: 'Available',
    services: ['Wi-Fi', 'AC', 'TV', 'Attached Bathroom', 'Room Service', 'Breakfast'],
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
  },
  {
    roomNumber: '102',
    name: 'Standard Room',
    type: 'Standard',
    description: 'Cozy and functional room suited for solo travelers or short business trips.',
    price: 1800,
    status: 'Available',
    services: ['Wi-Fi', 'AC', 'TV', 'Attached Bathroom'],
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
  },
  {
    roomNumber: '103',
    name: 'Premium Room',
    type: 'Premium',
    description: 'Spacious room with modern interiors, workstation, private balcony, and city skyline view.',
    price: 3000,
    status: 'Available',
    services: ['Wi-Fi', 'AC', 'TV', 'Attached Bathroom', 'Room Service', 'Parking', 'Breakfast'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
  {
    roomNumber: '104',
    name: 'Family Room',
    type: 'Family',
    description: 'Expansive family suite featuring two queen beds, kids area, and complimentary minibar.',
    price: 3500,
    status: 'Sold Out',
    services: ['Wi-Fi', 'AC', 'TV', 'Attached Bathroom', 'Room Service', 'Parking', 'Breakfast'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
  },
  {
    roomNumber: '105',
    name: 'Suite Room',
    type: 'Suite',
    description: 'Luxury executive suite with separate living area, bathtub, panoramic view, and 24/7 concierge.',
    price: 4500,
    status: 'Available',
    services: ['Wi-Fi', 'AC', 'TV', 'Attached Bathroom', 'Room Service', 'Parking', 'Breakfast'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
  },
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/room_booking_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing rooms
    await Room.deleteMany();
    console.log('Cleared existing rooms.');

    // Insert sample rooms
    const createdRooms = await Room.insertMany(sampleRooms);
    console.log(`Successfully seeded ${createdRooms.length} rooms!`);

    // Ensure a demo user exists
    let demoUser = await User.findOne({ email: 'guest@hotel.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Guest User',
        phone: '9876543210',
        email: 'guest@hotel.com',
        password: 'password123',
      });
      console.log('Created sample demo user: guest@hotel.com / password123');
    }

    // Optional: seed a sample booking for admin stats
    const existingBookings = await Booking.countDocuments();
    if (existingBookings === 0 && createdRooms.length > 0) {
      const today = new Date();
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);
      const checkOut = new Date(today);
      checkOut.setDate(today.getDate() + 3);

      await Booking.create({
        user: demoUser._id,
        room: createdRooms[0]._id,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkInTime: '12:00 PM',
        checkOutDate: checkOut.toISOString().split('T')[0],
        checkOutTime: '11:00 AM',
        totalNights: 2,
        totalAmount: createdRooms[0].price * 2,
        status: 'Confirmed',
      });
      console.log('Created initial sample booking for stats.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
