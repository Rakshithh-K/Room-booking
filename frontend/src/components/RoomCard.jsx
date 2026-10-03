import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Wind, Tv, Bath, Coffee, Utensils, Car, Check, Ban } from 'lucide-react';

const serviceIcons = {
  'wi-fi': Wifi,
  wifi: Wifi,
  ac: Wind,
  'air conditioning': Wind,
  tv: Tv,
  television: Tv,
  'attached bathroom': Bath,
  bathroom: Bath,
  'room service': Utensils,
  breakfast: Coffee,
  parking: Car,
};

const getServiceIcon = (serviceName) => {
  const normalized = serviceName.toLowerCase().trim();
  const IconComponent = serviceIcons[normalized] || Check;
  return <IconComponent className="w-3.5 h-3.5" />;
};

const RoomCard = ({ room, selectedDates }) => {
  const navigate = useNavigate();
  const isSoldOut = room.status === 'Sold Out';

  const handleBookNow = () => {
    if (isSoldOut) return;
    const searchParams = new URLSearchParams();
    searchParams.set('roomId', room._id);
    if (selectedDates?.checkInDate) searchParams.set('checkInDate', selectedDates.checkInDate);
    if (selectedDates?.checkInTime) searchParams.set('checkInTime', selectedDates.checkInTime);
    if (selectedDates?.checkOutDate) searchParams.set('checkOutDate', selectedDates.checkOutDate);
    if (selectedDates?.checkOutTime) searchParams.set('checkOutTime', selectedDates.checkOutTime);

    navigate(`/booking?${searchParams.toString()}`);
  };

  // Fallback image if room image is empty or invalid
  const imageUrl =
    room.image ||
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      {/* Room Image & Badges */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
        <img
          src={imageUrl}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Room Number Badge */}
        <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md">
          Room {room.roomNumber}
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <span className="inline-flex items-center gap-1 bg-red-600/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs">
              <Ban className="w-3 h-3" />
              Sold Out
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              Available
            </span>
          )}
        </div>

        {/* Room Type Overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-block bg-white/90 backdrop-blur-sm text-stone-800 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded shadow-xs">
            {room.type}
          </span>
        </div>
      </div>

      {/* Room Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                {room.name}
              </h3>
              <p className="text-stone-500 text-xs mt-1 line-clamp-2">
                {room.description}
              </p>
            </div>
          </div>

          {/* Room Services / Amenities */}
          <div className="mt-3 pt-3 border-t border-stone-100">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
              Services & Amenities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {room.services && room.services.length > 0 ? (
                room.services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    {getServiceIcon(service)}
                    <span>{service}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-stone-400 italic">Standard services</span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-stone-400 font-medium block">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-stone-900">₹{room.price.toLocaleString('en-IN')}</span>
              <span className="text-xs text-stone-500">/ night</span>
            </div>
          </div>

          {isSoldOut ? (
            <button
              disabled
              className="px-4 py-2.5 rounded-xl bg-stone-200 text-stone-400 text-sm font-semibold cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            <button
              onClick={handleBookNow}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Book Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
