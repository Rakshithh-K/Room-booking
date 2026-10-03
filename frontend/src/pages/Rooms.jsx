import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import RoomCard from '../components/RoomCard';
import { Search, Filter, Calendar, AlertCircle } from 'lucide-react';

const Rooms = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper date defaults
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const initialCheckIn = searchParams.get('checkInDate') || getTodayStr();
  const initialCheckInTime = searchParams.get('checkInTime') || '12:00 PM';
  const initialCheckOut = searchParams.get('checkOutDate') || getTomorrowStr();
  const initialCheckOutTime = searchParams.get('checkOutTime') || '11:00 AM';
  const initialType = searchParams.get('type') || 'All';

  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkInTime, setCheckInTime] = useState(initialCheckInTime);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [checkOutTime, setCheckOutTime] = useState(initialCheckOutTime);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateError, setDateError] = useState('');

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

  const handleDateValidation = (inDate, outDate) => {
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

  const filteredRooms = rooms.filter((room) => {
    // Type filter
    if (selectedType !== 'All' && room.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'All' && room.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = room.name.toLowerCase().includes(q);
      const matchNumber = room.roomNumber.toLowerCase().includes(q);
      const matchDesc = room.description.toLowerCase().includes(q);
      return matchName || matchNumber || matchDesc;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
          Explore Available Rooms
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-1">
          Pick your preferred luxury suite and book effortlessly.
        </p>
      </div>

      {/* Date Preference Bar (Mobile Collapsible or Compact Bar) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs mb-6">
        <div className="flex items-center gap-2 mb-3 text-stone-700 font-semibold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Stay Dates</span>
        </div>

        {dateError && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="text-[11px] text-stone-500 block mb-1">Check-in Date</label>
            <input
              type="date"
              min={getTodayStr()}
              value={checkInDate}
              onChange={(e) => {
                setCheckInDate(e.target.value);
                handleDateValidation(e.target.value, checkOutDate);
              }}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-stone-500 block mb-1">Check-in Time</label>
            <select
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="01:00 PM">01:00 PM</option>
              <option value="02:00 PM">02:00 PM</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-stone-500 block mb-1">Check-out Date</label>
            <input
              type="date"
              min={checkInDate}
              value={checkOutDate}
              onChange={(e) => {
                setCheckOutDate(e.target.value);
                handleDateValidation(checkInDate, e.target.value);
              }}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-stone-500 block mb-1">Check-out Time</label>
            <select
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by room name or number (e.g. 101, Deluxe)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          {/* Availability Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Sold Out">Sold Out Only</option>
          </select>
        </div>

        {/* Room Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['All', 'Deluxe', 'Standard', 'Premium', 'Family', 'Suite'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Room Listing Grid */}
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
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
          <Filter className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-base text-stone-900 mb-1">No rooms match your filter</h3>
          <p className="text-stone-500 text-xs">
            Try adjusting your search criteria or selecting a different category.
          </p>
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
    </div>
  );
};

export default Rooms;
