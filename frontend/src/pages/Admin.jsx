import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  QrCode,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Ban,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Filter,
  Download,
  Printer,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Mail,
  FileText,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'rooms' | 'bookings' | 'qrcode'

  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    soldOutRooms: 0,
    totalBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentBookings: [],
  });

  // Rooms State
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceRoom, setPriceRoom] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilterStatus, setBookingFilterStatus] = useState('All');
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  // Room Form State
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    name: '',
    type: 'Deluxe',
    description: '',
    price: '',
    status: 'Available',
    services: 'Wi-Fi, AC, TV, Attached Bathroom, Room Service',
    image: '',
  });

  const [notification, setNotification] = useState({ type: '', message: '' });

  // QR Code Configurable from Environment Variable
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const qrRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4000);
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err.message);
    }
  };

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await API.get('/admin/rooms');
      setRooms(res.data.data || []);
    } catch (err) {
      console.error('Error fetching admin rooms:', err.message);
    } finally {
      setRoomsLoading(false);
    }
  };

  // Fetch Bookings
  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await API.get('/admin/bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      console.error('Error fetching admin bookings:', err.message);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRooms();
    fetchBookings();
  }, []);

  // Room CRUD Handlers
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomFormData({
      roomNumber: '',
      name: '',
      type: 'Deluxe',
      description: '',
      price: '',
      status: 'Available',
      services: 'Wi-Fi, AC, TV, Attached Bathroom, Room Service',
      image: '',
    });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      roomNumber: room.roomNumber,
      name: room.name,
      type: room.type,
      description: room.description,
      price: room.price,
      status: room.status,
      services: Array.isArray(room.services) ? room.services.join(', ') : room.services,
      image: room.image || '',
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...roomFormData,
        price: Number(roomFormData.price),
        services: roomFormData.services
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingRoom) {
        await API.put(`/admin/rooms/${editingRoom._id}`, payload);
        showNotification(`Room ${payload.roomNumber} updated successfully`);
      } else {
        await API.post('/admin/rooms', payload);
        showNotification(`Room ${payload.roomNumber} created successfully`);
      }

      setRoomModalOpen(false);
      fetchRooms();
      fetchStats();
    } catch (err) {
      showNotification(err.message || 'Error saving room', 'error');
    }
  };

  const handleDeleteRoom = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete Room ${roomNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      await API.delete(`/admin/rooms/${id}`);
      showNotification(`Room ${roomNumber} deleted successfully`);
      fetchRooms();
      fetchStats();
    } catch (err) {
      showNotification(err.message || 'Failed to delete room', 'error');
    }
  };

  const handleToggleRoomStatus = async (room) => {
    const nextStatus = room.status === 'Available' ? 'Sold Out' : 'Available';
    try {
      await API.patch(`/admin/rooms/${room._id}/status`, { status: nextStatus });
      showNotification(`Room ${room.roomNumber} is now ${nextStatus}`);
      fetchRooms();
      fetchStats();
    } catch (err) {
      showNotification(err.message || 'Failed to update status', 'error');
    }
  };

  const handleOpenEditPrice = (room) => {
    setPriceRoom(room);
    setNewPrice(room.price);
    setPriceModalOpen(true);
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!priceRoom || !newPrice || Number(newPrice) < 0) return;

    try {
      await API.patch(`/admin/rooms/${priceRoom._id}/price`, { price: Number(newPrice) });
      showNotification(`Room ${priceRoom.roomNumber} price updated to ₹${Number(newPrice).toLocaleString('en-IN')}`);
      setPriceModalOpen(false);
      fetchRooms();
    } catch (err) {
      showNotification(err.message || 'Failed to update price', 'error');
    }
  };

  // Booking Status Handler
  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await API.patch(`/admin/bookings/${bookingId}/status`, { status });
      showNotification(`Booking status updated to ${status}`);
      fetchBookings();
      fetchStats();
    } catch (err) {
      showNotification(err.message || 'Failed to update booking status', 'error');
    }
  };

  // Resend Confirmation Email via Brevo HTTPS API
  const handleResendConfirmation = async (bookingId) => {
    try {
      setResendingId(bookingId);
      const res = await API.post(`/admin/bookings/${bookingId}/resend-confirmation`);
      showNotification('Confirmation email & PDF resent successfully via Brevo!');

      const updatedBooking = res.data?.data?.booking;
      const newMsgId = res.data?.data?.emailMessageId || updatedBooking?.emailMessageId;

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                emailStatus: 'sent',
                confirmationPdfGenerated: true,
                emailMessageId: newMsgId,
              }
            : b
        )
      );

      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking((prev) => ({
          ...prev,
          emailStatus: 'sent',
          confirmationPdfGenerated: true,
          emailMessageId: newMsgId,
        }));
      }
    } catch (err) {
      showNotification(err.message || 'Failed to resend confirmation email', 'error');
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? { ...b, emailStatus: 'failed' }
            : b
        )
      );
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking((prev) => ({
          ...prev,
          emailStatus: 'failed',
        }));
      }
    } finally {
      setResendingId(null);
    }
  };

  // Download QR Code PNG
  const handleDownloadQR = () => {
    const svg = document.getElementById('admin-qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 50, 500, 500);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'Room-Booking-QRCode.png';
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Print QR Stand
  const handlePrintQR = () => {
    window.print();
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus !== 'All' && b.status !== bookingFilterStatus) {
      return false;
    }
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase().trim();
      const matchCustomer = b.user?.name?.toLowerCase().includes(q) || b.user?.email?.toLowerCase().includes(q) || b.user?.phone?.includes(q);
      const matchRoom = b.room?.name?.toLowerCase().includes(q) || b.room?.roomNumber?.toLowerCase().includes(q);
      const matchId = b._id?.toLowerCase().includes(q);
      return matchCustomer || matchRoom || matchId;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Admin Top Bar */}
      <header className="bg-stone-900 text-white px-4 sm:px-8 py-4 flex items-center justify-between border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center font-serif text-lg">
            A
          </div>
          <div>
            <h1 className="font-serif font-bold text-base sm:text-lg leading-tight text-white flex items-center gap-2">
              <span>Shree Lodge Admin</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-sans font-semibold">
                Control Center
              </span>
            </h1>
            <p className="text-stone-400 text-xs hidden sm:block">
              Hotel Management, Rooms, Pricing & Bookings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
          >
            <span>View Customer Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <nav className="bg-white border-b border-stone-200 px-4 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'overview'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'rooms'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Rooms ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'bookings'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center gap-2 py-3.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'qrcode'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
        </div>
      </nav>

      {/* Global Notifications */}
      {notification.message && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-4 w-full">
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs ${notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider">Total Rooms</span>
                  <BedDouble className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900">
                  {stats.totalRooms}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-500">
                  <span className="text-emerald-600 font-semibold">{stats.availableRooms} Available</span>
                  <span>•</span>
                  <span className="text-red-600 font-semibold">{stats.soldOutRooms} Sold Out</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider">Total Bookings</span>
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900">
                  {stats.totalBookings}
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Across all registered guests
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider">Total Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Confirmed & completed stays
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider">Registered Guests</span>
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900">
                  {stats.totalCustomers}
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Customer accounts created
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Quick Actions
                </h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('rooms');
                      handleOpenAddRoom();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add New Hotel Room
                    </span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4" />
                      Manage Customer Bookings
                    </span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('qrcode')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Print Entrance QR Code
                    </span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Recent Bookings
                  </h3>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                  >
                    View All
                  </button>
                </div>

                {stats.recentBookings.length === 0 ? (
                  <p className="text-stone-400 text-xs py-8 text-center">
                    No bookings logged yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentBookings.map((b) => (
                      <div
                        key={b._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-100 gap-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-stone-900">
                            {b.user?.name || 'Guest'}{' '}
                            <span className="font-normal text-stone-500">
                              booked {b.room?.name} (Room {b.room?.roomNumber})
                            </span>
                          </div>
                          <div className="text-stone-500 text-[11px] mt-0.5">
                            Stay: {b.checkInDate} to {b.checkOutDate}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="font-bold text-stone-900">
                            ₹{b.totalAmount?.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${b.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ROOM MANAGEMENT ================= */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  Room Management
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                  Configure rooms, update prices, toggle availability, and edit amenities.
                </p>
              </div>

              <button
                onClick={handleOpenAddRoom}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room</span>
              </button>
            </div>

            {/* Room List Table on Desktop & Cards on Mobile */}
            {roomsLoading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-stone-400 text-xs">Loading rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
                <BedDouble className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <h3 className="font-serif font-bold text-base text-stone-900">No rooms configured</h3>
                <p className="text-stone-500 text-xs mt-1 mb-4">Add your first hotel room to start taking bookings.</p>
                <button
                  onClick={handleOpenAddRoom}
                  className="px-4 py-2 bg-amber-600 text-white font-semibold text-xs rounded-xl"
                >
                  Add Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rooms.map((room) => {
                  const isSoldOut = room.status === 'Sold Out';
                  return (
                    <div
                      key={room._id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      {/* Image & Badges */}
                      <div className="relative aspect-16/10 bg-stone-100">
                        <img
                          src={
                            room.image ||
                            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
                          }
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-stone-900/80 text-white text-xs font-semibold px-2 py-0.5 rounded">
                          Room {room.roomNumber}
                        </div>
                        <div className="absolute top-2.5 right-2.5">
                          <button
                            onClick={() => handleToggleRoomStatus(room)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 ${isSoldOut
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            title="Click to toggle status"
                          >
                            {isSoldOut ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            <span>{room.status}</span>
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {room.type}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-base text-stone-900">
                            {room.name}
                          </h3>
                          <p className="text-stone-500 text-xs mt-1 line-clamp-2">
                            {room.description}
                          </p>

                          {/* Services */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {room.services?.slice(0, 4).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded font-medium"
                              >
                                {s}
                              </span>
                            ))}
                            {room.services?.length > 4 && (
                              <span className="text-[10px] text-stone-400 self-center">
                                +{room.services.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="mt-5 pt-3 border-t border-stone-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-stone-500">Price / night</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-bold text-stone-900">
                                ₹{room.price.toLocaleString('en-IN')}
                              </span>
                              <button
                                onClick={() => handleOpenEditPrice(room)}
                                className="p-1 text-amber-700 hover:bg-amber-50 rounded"
                                title="Edit Price"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleToggleRoomStatus(room)}
                              className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-colors ${isSoldOut
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                            >
                              {isSoldOut ? 'Make Available' : 'Mark Sold Out'}
                            </button>

                            <button
                              onClick={() => handleOpenEditRoom(room)}
                              className="py-2 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteRoom(room._id, room.roomNumber)}
                              className="py-2 px-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BOOKINGS MANAGEMENT ================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  Guest Reservations
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                  Track guest schedules, update reservation statuses, and view totals.
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, email, or room..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
              </div>

              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Bookings Table (Desktop) / Cards (Mobile) */}
            {bookingsLoading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-stone-400 text-xs">Loading reservations...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
                <CalendarCheck className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <h3 className="font-serif font-bold text-base text-stone-900">No bookings match filter</h3>
                <p className="text-stone-500 text-xs mt-1">Adjust search keyword or status filter.</p>
              </div>
            ) : (
              <div>
                {/* Desktop View Table */}
                <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-600">
                      <thead className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Booking ID</th>
                          <th className="py-3 px-4">Customer Details</th>
                          <th className="py-3 px-4">Room</th>
                          <th className="py-3 px-4">Check-in / Out</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Email Status</th>
                          <th className="py-3 px-4">PDF Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-stone-50/50">
                            <td className="py-3 px-4 font-mono font-semibold text-stone-800">
                              #{b._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-stone-900">{b.user?.name || 'Guest'}</div>
                              <div className="text-[11px] text-stone-500">{b.user?.phone}</div>
                              <div className="text-[11px] text-stone-400">{b.user?.email}</div>
                            </td>
                            <td className="py-3 px-4 font-medium text-stone-800">
                              {b.room?.name || 'Room'}{' '}
                              <span className="text-[11px] text-stone-500 font-normal">
                                ({b.room?.roomNumber})
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="font-medium text-stone-800">In:</span> {b.checkInDate} ({b.checkInTime})
                              </div>
                              <div className="text-stone-500">
                                <span className="font-medium text-stone-800">Out:</span> {b.checkOutDate} ({b.checkOutTime})
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-stone-900">
                              ₹{b.totalAmount?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${b.status === 'Confirmed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.status === 'Cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            {/* Email Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  b.emailStatus === 'sent'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.emailStatus === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {b.emailStatus === 'sent' && <Mail className="w-3 h-3 text-emerald-600" />}
                                {b.emailStatus === 'failed' && <AlertCircle className="w-3 h-3 text-red-600" />}
                                {(!b.emailStatus || b.emailStatus === 'pending') && <Clock className="w-3 h-3 text-amber-600" />}
                                <span className="capitalize">{b.emailStatus || 'pending'}</span>
                              </span>
                            </td>
                            {/* PDF Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  b.confirmationPdfGenerated
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>{b.confirmationPdfGenerated ? 'Generated' : 'Failed'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <select
                                  value={b.status}
                                  onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                                  className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                <button
                                  onClick={() => setSelectedBooking(b)}
                                  className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                                  title="View Booking Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleResendConfirmation(b._id)}
                                  disabled={resendingId === b._id}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                    b.emailStatus === 'failed'
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                  }`}
                                  title="Resend Confirmation Email via Brevo"
                                >
                                  <RefreshCw className={`w-3 h-3 ${resendingId === b._id ? 'animate-spin' : ''}`} />
                                  <span>{resendingId === b._id ? 'Sending...' : 'Resend Email'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-3">
                  {filteredBookings.map((b) => (
                    <div
                      key={b._id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <span className="font-mono font-semibold text-stone-700">
                          #{b._id.slice(-6).toUpperCase()}
                        </span>
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                          className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <span className="font-bold text-stone-900 block text-sm">
                          {b.user?.name || 'Guest'}
                        </span>
                        <div className="text-stone-500 text-[11px] mt-0.5">
                          {b.user?.phone} • {b.user?.email}
                        </div>
                      </div>

                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 space-y-1 text-stone-600">
                        <div className="font-semibold text-stone-800">
                          {b.room?.name} (Room {b.room?.roomNumber})
                        </div>
                        <div>Check-in: {b.checkInDate} at {b.checkInTime}</div>
                        <div>Check-out: {b.checkOutDate} at {b.checkOutTime}</div>
                      </div>

                      {/* Email & PDF status badges on mobile */}
                      <div className="flex items-center justify-between py-1 border-t border-b border-stone-100 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-400">Email:</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                              b.emailStatus === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.emailStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <span className="capitalize">{b.emailStatus || 'pending'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-400">PDF:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              b.confirmationPdfGenerated
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {b.confirmationPdfGenerated ? 'Generated' : 'Failed'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-stone-400 text-[10px] block uppercase font-semibold">Total Price</span>
                          <span className="text-base font-bold text-stone-900">
                            ₹{b.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleResendConfirmation(b._id)}
                            disabled={resendingId === b._id}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                              b.emailStatus === 'failed'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-stone-800 hover:bg-stone-900 text-white'
                            }`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${resendingId === b._id ? 'animate-spin' : ''}`} />
                            <span>{resendingId === b._id ? 'Sending...' : 'Resend Email'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: QR CODE UTILITY ================= */}
        {activeTab === 'qrcode' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                Official Hotel Booking QR Stand
              </h2>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                Place this QR code at reception or in rooms for guests to scan and open the room booking system instantly.
              </p>
            </div>

            {/* Printable Frame Stand */}
            <div
              ref={qrRef}
              className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-xl text-center space-y-5 print:border-none print:shadow-none"
            >
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-700">
                  Welcome to
                </span>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                  Shree Lodge & Rooms
                </h3>
                <p className="text-stone-500 text-xs">
                  Scan to browse rooms & make an instant reservation
                </p>
              </div>

              {/* QR Code Container */}
              <div className="inline-block p-4 sm:p-6 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner">
                <QRCodeSVG
                  id="admin-qr-code-svg"
                  value={appUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* URL Display */}
              <div className="bg-stone-100 rounded-xl p-3 border border-stone-200 font-mono text-xs text-stone-700 break-all select-all">
                {appUrl}
              </div>

              <p className="text-[11px] text-stone-400">
                Compatible with all iOS and Android smartphone camera apps.
              </p>
            </div>

            {/* Actions: Download PNG & Print */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleDownloadQR}
                className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Image (PNG)</span>
              </button>

              <button
                onClick={handlePrintQR}
                className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Display Stand</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: ADD / EDIT ROOM ================= */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="font-serif font-bold text-xl text-stone-900">
                {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Room'}
              </h3>
              <button
                onClick={() => setRoomModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 106"
                    value={roomFormData.roomNumber}
                    onChange={(e) =>
                      setRoomFormData({ ...roomFormData, roomNumber: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Room Type
                  </label>
                  <select
                    value={roomFormData.type}
                    onChange={(e) =>
                      setRoomFormData({ ...roomFormData, type: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Premium">Premium</option>
                    <option value="Family">Family</option>
                    <option value="Suite">Suite</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Garden Suite"
                  value={roomFormData.name}
                  onChange={(e) =>
                    setRoomFormData({ ...roomFormData, name: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Spacious room with pool view, modern decor..."
                  value={roomFormData.description}
                  onChange={(e) =>
                    setRoomFormData({ ...roomFormData, description: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Price per Night (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="2500"
                    value={roomFormData.price}
                    onChange={(e) =>
                      setRoomFormData({ ...roomFormData, price: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Availability Status
                  </label>
                  <select
                    value={roomFormData.status}
                    onChange={(e) =>
                      setRoomFormData({ ...roomFormData, status: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Services & Amenities (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Wi-Fi, AC, TV, Attached Bathroom, Breakfast"
                  value={roomFormData.services}
                  onChange={(e) =>
                    setRoomFormData({ ...roomFormData, services: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={roomFormData.image}
                  onChange={(e) =>
                    setRoomFormData({ ...roomFormData, image: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-colors"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PRICE ================= */}
      {priceModalOpen && priceRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Update Room Price
              </h3>
              <button
                onClick={() => setPriceModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <p className="text-xs text-stone-500 mb-2">
                  Configuring price for <span className="font-semibold text-stone-800">{priceRoom.name}</span> (Room {priceRoom.roomNumber})
                </p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriceModalOpen(false)}
                  className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                >
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BOOKING DETAILS ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Reservation #{selectedBooking._id?.slice(-6).toUpperCase()}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900 mt-1">
                  Booking Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer Details */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-2">
                  Customer Details
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Name:</span>
                    <span className="font-semibold text-stone-900">{selectedBooking.user?.name || 'Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Phone:</span>
                    <span className="font-mono text-stone-800">{selectedBooking.user?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Email:</span>
                    <span className="font-mono text-stone-800">{selectedBooking.user?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Room & Stay Details */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-2">
                  Stay & Room Information
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Room:</span>
                    <span className="font-semibold text-stone-900">
                      {selectedBooking.room?.name} (Room {selectedBooking.room?.roomNumber})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Room Type:</span>
                    <span className="text-amber-700 font-semibold">{selectedBooking.room?.type || 'Deluxe'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Check-in:</span>
                    <span className="text-stone-800">{selectedBooking.checkInDate} at {selectedBooking.checkInTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Check-out:</span>
                    <span className="text-stone-800">{selectedBooking.checkOutDate} at {selectedBooking.checkOutTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Nights:</span>
                    <span className="text-stone-800">{selectedBooking.totalNights} {selectedBooking.totalNights === 1 ? 'Night' : 'Nights'}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-stone-200 text-sm font-bold">
                    <span className="text-stone-900">Total Amount:</span>
                    <span className="text-amber-700">₹{selectedBooking.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Email & PDF Delivery Information */}
              <div className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-200/60">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block mb-2.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Email Confirmation & PDF Status</span>
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-medium">Email Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        selectedBooking.emailStatus === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedBooking.emailStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedBooking.emailStatus === 'sent' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {selectedBooking.emailStatus === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                      {(!selectedBooking.emailStatus || selectedBooking.emailStatus === 'pending') && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{selectedBooking.emailStatus || 'pending'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-600 font-medium">PDF Confirmation:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedBooking.confirmationPdfGenerated
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{selectedBooking.confirmationPdfGenerated ? 'Generated' : 'Failed'}</span>
                    </span>
                  </div>

                  {selectedBooking.emailMessageId && (
                    <div className="pt-2 border-t border-amber-100 flex flex-col gap-0.5">
                      <span className="text-[10px] text-stone-400 uppercase font-semibold">Brevo Message ID</span>
                      <span className="font-mono text-[11px] text-stone-700 break-all bg-white p-1.5 rounded-lg border border-amber-200">
                        {selectedBooking.emailMessageId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-5 mt-4 border-t border-stone-100 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleResendConfirmation(selectedBooking._id)}
                disabled={resendingId === selectedBooking._id}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-70 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingId === selectedBooking._id ? 'animate-spin' : ''}`} />
                <span>
                  {resendingId === selectedBooking._id
                    ? 'Resending via Brevo...'
                    : 'Resend Confirmation Email'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
