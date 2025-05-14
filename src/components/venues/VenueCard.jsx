import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Car, Calendar } from 'lucide-react';

const VenueCard = ({ venue }) => {
  // Map of venue names to their specific areas
  const venueAreas = {
    'City View Hall': 'Banjara Hills',
    'Sunset Terrace': 'Banjara Hills',
    'Elegant Palace': 'Golconda',
    'Modern Hall': 'Golconda',
    'Royal Garden': 'Moti Nagar',
    'Grand Ballroom': 'Hitech City',
    'Heritage Palace': 'Attapur, Rajendra Nagar',
    'King\'s Classic Garden': 'Hyderabad',
    'P R Palace': 'Hyderabad',
    'Rhodium 7 Convention': 'Attapur',
    'The Vintage Palace': 'Karwan West, Karwan',
    'Kompally Convention Center': 'Kompally',
    'Kukatpally Business Hub': 'Kukatpally',
    'Dilsukhnagar Grand Palace': 'Dilsukhnagar',
    'Tarnaka Garden Venue': 'Tarnaka',
    'Uppal Convention Hall': 'Uppal',
    'LB Nagar Business Center': 'LB Nagar',
    'Alwal Grand Palace': 'Alwal',
    'Malkajgiri Garden Venue': 'Malkajgiri',
    'ECIL Convention Center': 'ECIL',
    'KPHB Business Hub': 'KPHB'
  };

  // Format the address to ensure we always have something to display
  const formatLocation = (venue) => {
    // Return the specific area for the venue if it exists in our map
    return venueAreas[venue.name] || 'Hyderabad';
  };

  return (
    <Link to={`/venues/${venue._id}`} className="block">
      <div className="card group overflow-hidden h-full rounded-2xl">
        {/* Image container with overlay - UPDATED with lighter gradient */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={venue.imageUrl || venue.image}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <div className="absolute bottom-3 left-3 flex items-center space-x-1">
            <div className="bg-white rounded-full p-1">
              <MapPin className="h-4 w-4 text-pink-600" />
            </div>
            <span className="text-white font-medium text-sm">{formatLocation(venue)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-gray-800 group-hover:text-pink-600 transition-colors">
              {venue.name}
            </h3>
            <div className="flex items-center bg-cream-100 text-amber-700 px-2 py-0.5 rounded-md text-sm font-medium">
              <span>★</span>
              <span>{venue.rating?.toFixed(1) || '4.0'}</span>
            </div>
          </div>

          <div className="flex items-center text-gray-500 text-sm mb-3">
            <Users className="h-4 w-4 mr-1" />
            <span>Up to {venue.capacity} guests</span>
          </div>

          {/* Always show address in the content area too */}
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{formatLocation(venue)}</span>
          </div>

          {venue.hasParking && (
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <Car className="h-4 w-4 mr-1" />
              <span>Parking available</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="text-pink-600 font-medium">
              ₹{(venue.dailyRate || venue.pricePerHour || 0).toLocaleString()}<span className="text-gray-500 text-sm">/day</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Check availability</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VenueCard;