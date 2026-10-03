const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// CORS configuration supporting production Render frontend and local development
const allowedOrigins = [
  'https://room-booking-1-llgo.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, tests, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        return allowed.replace(/\/+$/, '') === origin.replace(/\/+$/, '');
      });

      if (isAllowed || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Room Booking API is running smoothly',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Primary API Routes (standard /api prefix)
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Route aliases without /api prefix for compatibility and defense against misconfigured clients
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/bookings', bookingRoutes);
app.use('/admin', adminRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
