import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  LogOut,
  BedDouble,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3
} from 'lucide-react';

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchMyBookings = async () => {
      try {
        setLoading(true);
        const res = await API.get('/bookings/my');
        setBookings(res.data.data || []);
      } catch (err) {
        console.error('Error fetching my bookings:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [isAuthenticated]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await API.patch(`/bookings/${bookingId}/status`, { status: 'Cancelled' });
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: 'Cancelled' } : b))
      );
      setMessage('Reservation cancelled successfully');
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center pb-24">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Guest Profile</h1>
        <p className="text-stone-500 text-xs sm:text-sm mb-6">
          Sign in to view your room bookings, check-in schedules, and personal account details.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock3 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md shadow-amber-600/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-tight">
                {user?.name}
              </h1>
              <p className="text-stone-500 text-xs flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{user?.email}</span>
              </p>
              <p className="text-stone-500 text-xs flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>+91 {user?.phone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Bookings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-stone-900">
            My Reservations ({bookings.length})
          </h2>
          <Link
            to="/rooms"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
          >
            Book Another Room
          </Link>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {message}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="h-4 bg-stone-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-stone-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-stone-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
            <BedDouble className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              No reservations yet
            </h3>
            <p className="text-stone-500 text-xs mb-5 max-w-xs mx-auto">
              You haven't made any hotel reservations yet. Check out our available rooms!
            </p>
            <Link
              to="/rooms"
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-md"
            >
              Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-4"
              >
                {/* Room thumbnail */}
                <div className="sm:w-36 h-28 sm:h-auto rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <img
                    src={
                      booking.room?.image ||
                      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={booking.room?.name || 'Room'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono font-semibold text-stone-500">
                        #{booking._id.slice(-8).toUpperCase()}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>

                    <h3 className="font-serif font-bold text-base text-stone-900">
                      {booking.room?.name || 'Room'}{' '}
                      <span className="text-xs font-sans font-medium text-stone-500">
                        (Room {booking.room?.roomNumber})
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>In: {booking.checkInDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{booking.checkInTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Out: {booking.checkOutDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{booking.checkOutTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                        Total ({booking.totalNights} {booking.totalNights === 1 ? 'night' : 'nights'})
                      </span>
                      <span className="text-base font-bold text-stone-900">
                        ₹{booking.totalAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {booking.status === 'Confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Stay'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
