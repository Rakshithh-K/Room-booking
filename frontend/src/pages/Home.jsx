import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import RoomCard from '../components/RoomCard';
import { Calendar, Clock, Search, Sparkles, ShieldCheck, HeartHandshake, UtensilsCrossed, AlertCircle } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  // Helper date format YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [checkInDate, setCheckInDate] = useState(getTodayStr());
  const [checkInTime, setCheckInTime] = useState('12:00 PM');
  const [checkOutDate, setCheckOutDate] = useState(getTomorrowStr());
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [dateError, setDateError] = useState('');

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');

  // Fetch rooms from Express backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await API.get('/rooms');
        setRooms(res.data.data || []);
      } catch (err) {
        console.error('Error fetching rooms:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const validateDates = (inDate, outDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dIn = new Date(inDate);
    dIn.setHours(0, 0, 0, 0);
    const dOut = new Date(outDate);
    dOut.setHours(0, 0, 0, 0);

    if (dIn < today) {
      setDateError('Check-in date cannot be in the past');
      return false;
    }
    if (dOut <= dIn) {
      setDateError('Check-out date must be strictly after check-in date');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleCheckInChange = (e) => {
    const val = e.target.value;
    setCheckInDate(val);
    validateDates(val, checkOutDate);
  };

  const handleCheckOutChange = (e) => {
    const val = e.target.value;
    setCheckOutDate(val);
    validateDates(checkInDate, val);
  };

  const handleSearchRooms = (e) => {
    e.preventDefault();
    if (!validateDates(checkInDate, checkOutDate)) return;

    // Navigate to /rooms with the chosen dates
    const params = new URLSearchParams({
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      type: filterType !== 'All' ? filterType : '',
    });
    navigate(`/rooms?${params.toString()}`);
  };

  const filteredRooms = filterType === 'All'
    ? rooms
    : rooms.filter((r) => r.type.toLowerCase() === filterType.toLowerCase());

  return (
    <div className="pb-24 sm:pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-stone-900 via-stone-900 to-stone-850 text-white pt-8 pb-20 px-4 sm:px-6 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#b8863f_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-3">

            <span>Welcome to Shree Lodge</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-white mb-3">
            Find Your Sanctuary in Comfort
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto font-normal">
            Handcrafted rooms, seamless check-in, and world-class hospitality tailored for your perfect stay.
          </p>
        </div>
      </section>

      {/* Main Booking Section: "Find Your Room" */}
      <section className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-xl border border-stone-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
            <Search className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Find Your Room
            </h2>
          </div>

          {dateError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{dateError}</span>
            </div>
          )}

          <form onSubmit={handleSearchRooms} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Check-in Group */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Check-in Details
                </span>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-1">Date</label>
                    <input
                      type="date"
                      min={getTodayStr()}
                      value={checkInDate}
                      onChange={handleCheckInChange}
                      className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg px-2.5 py-2 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-1">Time</label>
                    <select
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg px-2.5 py-2 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM (Standard)</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Check-out Group */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Check-out Details
                </span>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-1">Date</label>
                    <input
                      type="date"
                      min={checkInDate}
                      value={checkOutDate}
                      onChange={handleCheckOutChange}
                      className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg px-2.5 py-2 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-1">Time</label>
                    <select
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-lg px-2.5 py-2 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM (Standard)</option>
                      <option value="12:00 PM">12:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-semibold text-sm sm:text-base rounded-xl shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Available Rooms</span>
            </button>
          </form>
        </div>
      </section>

      {/* Featured Room Collection */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              Our Rooms & Suites
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              Choose from our curated selection of luxury suites and rooms.
            </p>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Deluxe', 'Standard', 'Premium', 'Family', 'Suite'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterType === type
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-stone-200 p-4 animate-pulse">
                <div className="aspect-16/10 bg-stone-200 rounded-xl mb-3"></div>
                <div className="h-5 bg-stone-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-stone-200 rounded w-full mb-3"></div>
                <div className="h-8 bg-stone-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-md mx-auto">
            <p className="text-stone-500 text-sm">No rooms found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                selectedDates={{
                  checkInDate,
                  checkInTime,
                  checkOutDate,
                  checkOutTime,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Hotel Highlights Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-14">
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-6 sm:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <h3 className="font-serif font-bold text-lg text-stone-900">Why Stay With Us</h3>
            <p className="text-stone-600 text-xs mt-1">Exceptional hospitality and modern comfort guaranteed</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-amber-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-stone-900">Secure & Verified</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Instant booking confirmation directly with hotel management.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-stone-900">24/7 Room Service</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Freshly prepared gourmet dishes brought to your room anytime.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-stone-900">Best Rate Guarantee</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Direct transparent pricing with no hidden service surcharges.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
