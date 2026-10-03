import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  Receipt,
  BedDouble
} from 'lucide-react';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const roomId = searchParams.get('roomId');

  // Helper date defaults
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [checkInDate, setCheckInDate] = useState(
    searchParams.get('checkInDate') || getTodayStr()
  );
  const [checkInTime, setCheckInTime] = useState(
    searchParams.get('checkInTime') || '12:00 PM'
  );
  const [checkOutDate, setCheckOutDate] = useState(
    searchParams.get('checkOutDate') || getTomorrowStr()
  );
  const [checkOutTime, setCheckOutTime] = useState(
    searchParams.get('checkOutTime') || '11:00 AM'
  );

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [emailStatus, setEmailStatus] = useState('pending');

  // Fetch room data from MongoDB
  useEffect(() => {
    if (!roomId) {
      setErrorMessage('No room selected. Please select a room from the catalog.');
      setLoading(false);
      return;
    }

    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/rooms/${roomId}`);
        setRoom(res.data.data);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load room details');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Calculate duration in nights
  const calculateDuration = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateDuration();
  const isDateValid = nights > 0;
  const totalEstimatedAmount = room ? room.price * nights : 0;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAuthenticated) {
      // Store current url to redirect back after login
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (!room) {
      setErrorMessage('Room details missing');
      return;
    }

    if (room.status === 'Sold Out') {
      setErrorMessage('This room is currently Sold Out and cannot be booked.');
      return;
    }

    if (!isDateValid) {
      setErrorMessage('Check-out date must be strictly after check-in date');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/bookings', {
        roomId: room._id,
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
      });

      const bookingData = res.data?.data?.booking || res.data?.data;
      const resEmailStatus = res.data?.data?.emailStatus || bookingData?.emailStatus || 'sent';
      setBookingSuccess(bookingData);
      setEmailStatus(resEmailStatus);
    } catch (err) {
      setErrorMessage(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">Loading room details...</p>
      </div>
    );
  }

  // Booking Success Screen
  if (bookingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 pb-24 sm:pb-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-1">
            Booking Confirmed!
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mb-4">
            Your reservation at Shree Lodge Hotel has been securely placed.
          </p>

          {/* Email Confirmation Notice */}
          {emailStatus === 'sent' ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-left shadow-xs">
              <Mail className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold block text-emerald-950">Confirmation Email Dispatched</span>
                <span className="text-emerald-800">A confirmation email with your booking PDF attached has been sent to your registered email address ({user?.email || 'your account'}).</span>
              </div>
            </div>
          ) : emailStatus === 'failed' ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-left shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold block text-amber-950">Email Delivery Notice</span>
                <span className="text-amber-800">Your reservation is confirmed! However, the confirmation email could not be sent. You can review your booking details below or anytime in your profile.</span>
              </div>
            </div>
          ) : null}

          {/* Booking Summary Card */}
          <div className="bg-stone-50 rounded-2xl p-4 text-left border border-stone-200 space-y-3 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 text-xs">
              <span className="text-stone-500">Booking ID</span>
              <span className="font-mono font-semibold text-stone-800">
                #{bookingSuccess._id?.slice(-8).toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Room</span>
              <span className="font-semibold text-stone-900">
                {room?.name} (Room {room?.roomNumber})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Check-in</span>
              <span className="font-medium text-stone-800">
                {bookingSuccess.checkInDate} at {bookingSuccess.checkInTime}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Check-out</span>
              <span className="font-medium text-stone-800">
                {bookingSuccess.checkOutDate} at {bookingSuccess.checkOutTime}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Duration</span>
              <span className="font-medium text-stone-800">
                {bookingSuccess.totalNights} {bookingSuccess.totalNights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Email Status</span>
              <span className={`font-semibold capitalize ${emailStatus === 'sent' ? 'text-emerald-700' : emailStatus === 'failed' ? 'text-amber-700' : 'text-stone-600'}`}>
                {emailStatus === 'sent' ? 'Sent (PDF Attached)' : emailStatus === 'failed' ? 'Failed' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-sm font-bold">
              <span className="text-stone-900">Total Amount</span>
              <span className="text-amber-700">₹{bookingSuccess.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Link
              to="/profile"
              className="block w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-md"
            >
              View in My Bookings
            </Link>
            <Link
              to="/"
              className="block w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-2">Room Not Found</h2>
        <p className="text-stone-500 text-xs mb-6">
          {errorMessage || 'Please select an available room from the rooms catalog.'}
        </p>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Rooms</span>
        </Link>
      </div>
    );
  }

  const isSoldOut = room.status === 'Sold Out';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Rooms</span>
      </button>

      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-1">
        Confirm Your Reservation
      </h1>
      <p className="text-stone-500 text-xs sm:text-sm mb-6">
        Review your room details and booking schedule before finalizing.
      </p>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Room Details Card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-44 h-40 sm:h-auto bg-stone-100 relative">
            <img
              src={
                room.image ||
                'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
              }
              alt={room.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Room {room.roomNumber}
            </div>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {room.type}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSoldOut ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                >
                  {room.status}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {room.name}
              </h3>
              <p className="text-stone-500 text-xs mt-1 line-clamp-2">
                {room.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-stone-100 flex items-baseline justify-between">
              <span className="text-xs text-stone-500">Base Price:</span>
              <span className="text-base font-bold text-stone-900">
                ₹{room.price.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-stone-500 font-normal">/ night</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form / Duration & Date Configurator */}
      <form onSubmit={handleBookingSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Select Dates & Times</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Check-in */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                Check-in
              </span>
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Date</label>
                <input
                  type="date"
                  min={getTodayStr()}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Estimated Arrival</label>
                <select
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM (Standard)</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                </select>
              </div>
            </div>

            {/* Check-out */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                Check-out
              </span>
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Date</label>
                <input
                  type="date"
                  min={checkInDate}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-500 block mb-1">Departure Time</label>
                <select
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM (Standard)</option>
                  <option value="12:00 PM">12:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Details Section */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100 mb-3">
            <User className="w-4 h-4 text-amber-600" />
            <span>Guest Information</span>
          </h3>

          {isAuthenticated ? (
            <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-stone-800 font-semibold">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>{user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>+91 {user?.phone}</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-stone-700 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold block text-amber-900">Login Required to Book</span>
                <span className="text-[11px] text-amber-700">Please sign in or register to complete this booking.</span>
              </div>
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                className="px-3.5 py-1.5 bg-amber-600 text-white font-semibold rounded-lg text-xs whitespace-nowrap"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Booking Calculation & Total */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Price Breakdown</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Room Rate</span>
              <span>₹{room.price.toLocaleString('en-IN')} / night</span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Duration</span>
              <span className="font-medium text-stone-800">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Taxes & Service Fees</span>
              <span className="text-emerald-600 font-medium">Included</span>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-stone-900 block">Total Estimated Amount</span>
                <span className="text-[10px] text-stone-400">Payable at hotel or upon check-in</span>
              </div>
              <span className="text-2xl font-bold text-amber-700">
                ₹{totalEstimatedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {isSoldOut ? (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-700 font-semibold">
            This room is currently Sold Out and cannot be booked.
          </div>
        ) : (
          <button
            type="submit"
            disabled={submitting || !isDateValid}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl shadow-xl shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Securing Your Reservation...</span>
              </>
            ) : !isAuthenticated ? (
              <span>Login & Confirm Booking</span>
            ) : (
              <span>Confirm & Book Room (₹{totalEstimatedAmount.toLocaleString('en-IN')})</span>
            )}
          </button>
        )}
      </form>
    </div>
  );
};

export default Booking;
