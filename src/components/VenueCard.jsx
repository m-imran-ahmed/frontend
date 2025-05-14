import React, { useState } from 'react';
import { MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { venueImages } from '../assets/images';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const getVenueImageList = (venueName) => {
  // Try to find up to 7 images for the venue in .webp, .jpeg, .jpg
  const basePath = '/src/assets/Images/';
  const extensions = ['webp', 'jpeg', 'jpg'];
  const images = [];
  for (let i = 1; i <= 7; i++) {
    let found = false;
    for (const ext of extensions) {
      const fileName = `${venueName} ${i}.${ext}`;
      try {
        // Use require.context or import.meta.glob in Vite, but for static paths, just push
        images.push({ src: basePath + fileName });
        found = true;
        break;
      } catch {}
    }
    if (!found) break;
  }
  // Always add the main image as the first one if not already included
  if (venueImages[venueName]) {
    images.unshift({ src: venueImages[venueName] });
  }
  return images;
};

const VenueCard = ({ venue, onClick }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const images = getVenueImageList(venue.name);

  const handleImageClick = (e) => {
    e.preventDefault();
    setLightboxOpen(true);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      style={{ willChange: 'transform' }}
    >
      <div className="relative h-48" onClick={handleImageClick}>
        <img
          src={venueImages[venue.name] || venue.imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
          ₹{venue.dailyRate.toLocaleString()}/day
        </div>
        {lightboxOpen && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={images}
          />
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{venue.name}</h3>
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{venue.address || 'Address not specified'}</span>
        </div>
        <div className="flex items-center text-gray-600 mb-4">
          <Users className="h-4 w-4 mr-1" />
          <span className="text-sm">Up to {venue.capacity} guests</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {venue.amenities?.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full"
            >
              {typeof amenity === 'string' ? amenity : amenity.name}
            </span>
          ))}
          {venue.amenities?.length > 3 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              +{venue.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VenueCard;