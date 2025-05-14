import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Users, Calendar, Clock, Car, Utensils, Home, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import { getVenueById, checkVenueAvailability } from '../services/api';
import { venueImages } from '../assets/images';
import { setToStartOfDay, setToEndOfDay, isValidBookingDate } from '../utils/dateUtils';
import axios from 'axios';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { AuthContext } from '../context/AuthContext';

const placeholderImg = "https://via.placeholder.com/400x300?text=No+Image";

// Helper to get all images for a venue by name
const getVenueImageList = (venueName) => {
  // Only include up to 8 images that actually exist for the venue
  const extensions = ['webp', 'jpeg', 'jpg'];
  const images = [];
  // Try to add main image if available
  if (venueImages[venueName]) {
    images.push({ src: venueImages[venueName] });
  }
  // Add up to 7 more images with the pattern: VenueName 1.ext, VenueName 2.ext, ...
  for (let i = 1; i <= 7; i++) {
    let found = false;
    for (const ext of extensions) {
      const fileName = `${venueName} ${i}.${ext}`;
      const path = `/src/assets/Images/${fileName}`;
      // Only add if not already in images
      if (!images.find(img => img.src === path)) {
        images.push({ src: path });
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return images;
};

const VenueDetailsPage = () => {
  const { id, venueId } = useParams();
  const venueID = id || venueId; // Use either id or venueId depending on which route was matched
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [venue, setVenue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDateAvailable, setIsDateAvailable] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // 0 is always main image
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState([]); // 'ok' or 'error' for each image

  // Limit to 8 images max for gallery and carousel
  const galleryImages = venue ? getVenueImageList(venue.name).slice(0, 8) : [];

  useEffect(() => {
    setImageStatus(Array(galleryImages.length).fill('pending'));
  }, [venue]);

  const handleImgLoad = (idx) => {
    setImageStatus((prev) => {
      const next = [...prev];
      next[idx] = 'ok';
      return next;
    });
  };

  const handleImgError = (idx) => {
    setImageStatus((prev) => {
      const next = [...prev];
      next[idx] = 'error';
      return next;
    });
  };

  // Main image is always first
  const mainImage = galleryImages[0];
  // Only successfully loaded images after main
  const loadedImages = galleryImages.slice(1).map((img, idx) => ({ ...img, idx: idx + 1, status: imageStatus[idx + 1] })).filter(img => img.status === 'ok');
  // If all fail, show placeholder
  const hasLoaded = loadedImages.length > 0;

  // Carousel navigation (0 = main, 1... = loadedImages)
  const totalSlides = 1 + loadedImages.length;
  const getImageForIndex = (idx) => {
    if (idx === 0) return { ...mainImage, idx: 0, status: imageStatus[0] };
    return loadedImages[idx - 1];
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const fetchVenue = async () => {
      setIsLoading(true);
      setError(null);
      
      // Check if id is undefined or null
      if (!venueID) {
        setError("Venue ID is missing. Please select a valid venue.");
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getVenueById(venueID);
        setVenue(data);
      } catch (error) {
        console.error('Error fetching venue:', error);
        setError("Could not find venue details. Please try again or select another venue.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVenue();
  }, [venueID]);

  const checkAvailability = async (date) => {
    if (!date) return;
    
    setIsCheckingAvailability(true);
    try {
      // Use start of day for start date and end of day for end date
      const startDate = setToStartOfDay(new Date(date));
      const endDate = setToEndOfDay(new Date(date));

      console.log('Checking availability for:', {
        venueID,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const { available } = await checkVenueAvailability(
        venueID,
        startDate.toISOString(),
        endDate.toISOString()
      );

      setIsDateAvailable(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsDateAvailable(false);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setIsDateAvailable(null); // Reset availability status
    if (newDate) {
      // Add a small delay to ensure the state is updated
      setTimeout(() => {
        checkAvailability(newDate);
      }, 100);
    }
  };

  const handleBook = () => {
    if (!selectedDate || !isDateAvailable) return;
    
    // Check if the user is authenticated
    if (!isAuthenticated) {
      // Save the current URL in state so we can redirect back after login
      navigate('/login', { 
        state: { 
          from: `/booking/${venue._id}?date=${selectedDate}`,
          message: 'Please log in to book this venue' 
        } 
      });
      return;
    }
    
    // Format the date properly for URL parameter
    const formattedDate = selectedDate;
    
    // Log for debugging
    console.log(`Navigating to booking page: /booking/${venue._id}?date=${formattedDate}`);
    
    // Ensure we're scrolling to top before navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Use setTimeout to ensure the scroll completes before navigation
    setTimeout(() => {
      navigate(`/booking/${venue._id}?date=${formattedDate}`);
    }, 100);
  };

  const formatLocation = (venue) => {
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

    // Return the specific area for the venue if it exists in our map
    return venueAreas[venue.name] || 'Hyderabad';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-pink-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container text-center py-16 mx-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="page-container text-center py-16 mx-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Venue Not Found</h2>
        <p className="text-gray-600 mb-8">
          The venue you're looking for doesn't exist or has been removed.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Venue Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Hero Image Section with Carousel */}
            <div className="relative h-[45vh] cursor-pointer" onClick={() => { setLightboxIndex(getImageForIndex(activeImageIndex)?.idx || 0); setLightboxOpen(true); }}>
              {totalSlides > 0 ? (
                <img
                  src={getImageForIndex(activeImageIndex)?.status === 'error' ? placeholderImg : getImageForIndex(activeImageIndex)?.src}
                  alt={venue?.name}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImgLoad(getImageForIndex(activeImageIndex)?.idx)}
                  onError={() => handleImgError(getImageForIndex(activeImageIndex)?.idx)}
                />
              ) : (
                <img src={placeholderImg} alt="No Image" className="w-full h-full object-cover" />
              )}
              
              {/* Carousel controls - Using big arrow buttons */}
              {totalSlides > 1 && (
                <>
                  <button 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-pink-600 rounded-full p-3 shadow-lg z-10 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-pink-600 rounded-full p-3 shadow-lg z-10 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {[...Array(totalSlides)].map((_, idx) => (
                      <span key={idx} className={`w-2 h-2 rounded-full ${idx === activeImageIndex ? 'bg-pink-500' : 'bg-white/70'} inline-block`}></span>
                    ))}
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              {/* Venue Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{venue.name}</h1>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-white/90">
                        <MapPin className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">{formatLocation(venue)}</span>
                      </div>
                      <div className="flex items-center text-white/90">
                        <Users className="h-4 w-4 mr-1.5" />
                        <span className="text-sm">{venue.capacity} guests</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <div className="text-white text-lg font-bold">₹{venue.dailyRate?.toLocaleString()}</div>
                    <div className="text-white/80 text-xs">per day</div>
                  </div>
                </div>
              </div>

              {/* Price Badge */}
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-pink-100">
                  <div className="flex flex-col items-end">
                    <div className="text-sm text-gray-600 mb-1">Starting from</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-pink-600">₹{venue.dailyRate.toLocaleString()}</span>
                      <span className="text-sm text-gray-500 ml-1">per day</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">+ applicable taxes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {totalSlides > 1 && (
              <div className="flex gap-2 px-6 py-4 overflow-x-auto">
                {[mainImage, ...loadedImages].map((img, idx) => (
                  <img
                    key={img.src}
                    src={img.status === 'error' ? placeholderImg : img.src}
                    alt={venue.name + ' photo ' + (idx + 1)}
                    className={`h-20 w-32 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-pink-400 ${activeImageIndex === idx ? 'ring-2 ring-pink-500' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                    onLoad={() => handleImgLoad(img.idx)}
                    onError={() => handleImgError(img.idx)}
                  />
                ))}
              </div>
            )}

            {/* Lightbox for all images */}
            {lightboxOpen && (
              <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={galleryImages}
                index={lightboxIndex}
              />
            )}

            {/* Content Section */}
            <div className="p-6">
              {/* Address Section - Prominently displayed */}
              <div className="bg-pink-50 p-4 rounded-lg mb-6 border border-pink-100">
                <h3 className="text-lg font-semibold text-pink-700 mb-2">Venue Address</h3>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-pink-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-gray-800">{formatLocation(venue)}</p>
                    {venue.location?.address && (
                      <p className="text-sm text-gray-600 mt-1">
                        {venue.location.address.street && `${venue.location.address.street}, `}
                        {venue.location.address.city && `${venue.location.address.city}, `}
                        {venue.location.address.state && `${venue.location.address.state}, `}
                        {venue.location.address.country && `${venue.location.address.country} `}
                        {venue.location.address.zipCode && venue.location.address.zipCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {venue.amenities.includes('Parking') && (
                  <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-100 shadow-sm">
                    <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-2">
                      <Car className="h-5 w-5" />
                    </div>
                    <span className="text-gray-800 font-medium">Available</span>
                    <span className="text-gray-500 text-sm">Parking</span>
                  </div>
                )}
                {venue.amenities.includes('Catering') && (
                  <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-100 shadow-sm">
                    <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-2">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <span className="text-gray-800 font-medium">In-house</span>
                    <span className="text-gray-500 text-sm">Catering</span>
                  </div>
                )}
              </div>

              {/* Rate Details Card */}
              <div className="mb-6 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-100 p-5 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Rate Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Base Rate</span>
                      <span className="font-medium">₹{venue.dailyRate.toLocaleString()} per day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minimum Booking</span>
                      <span className="font-medium">1 day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Maximum Capacity</span>
                      <span className="font-medium">{venue.capacity} guests</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Security Deposit</span>
                      <span className="font-medium">₹{(venue.dailyRate * 0.2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-medium">18% GST</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cancellation</span>
                      <span className="font-medium text-green-600">Free cancellation until 24h before event</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-pink-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">Total per day</span>
                    <span className="text-xl font-bold text-pink-600">
                      ₹{(venue.dailyRate * 1.18).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">*Final price includes all applicable taxes</p>
                </div>
              </div>

              {/* Availability Check */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Check Availability</h2>
                <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl shadow-sm border border-pink-100 p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-full md:w-2/3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Your Date
                      </label>
                      <div className="relative group flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-pink-400 group-hover:text-pink-500 transition-colors" />
                        </div>
                        <input
                          type="date"
                          className={`pl-9 pr-3 h-12 w-full border-2 rounded-lg focus:outline-none focus:ring-2 text-sm transition-all duration-200 ${
                            selectedDate 
                              ? isDateAvailable === null
                                ? 'border-gray-200 focus:ring-pink-200 hover:border-pink-200'
                                : isDateAvailable
                                  ? 'border-green-400 focus:ring-green-200 bg-green-50/50 hover:border-green-500'
                                  : 'border-red-400 focus:ring-red-200 bg-red-50/50 hover:border-red-500'
                              : 'border-gray-200 focus:ring-pink-200 hover:border-pink-200'
                          }`}
                          min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                          value={selectedDate}
                          onChange={handleDateChange}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 md:mt-1">Bookings are available from tomorrow onwards</p>
                    </div>
                    <div className="w-full md:w-1/3 md:self-end md:mt-7">
                      <Button
                        variant="primary"
                        className={`w-full h-12 text-base font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                          selectedDate && !isDateAvailable 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-pink-200'
                        } shadow-lg hover:shadow-xl`}
                        onClick={handleBook}
                        disabled={!selectedDate || isDateAvailable === false || isCheckingAvailability}
                      >
                        {isCheckingAvailability 
                          ? (
                            <div className="flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Checking...
                            </div>
                          )
                          : selectedDate 
                            ? (isDateAvailable 
                                ? (
                                  <div className="flex items-center justify-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Book Now
                                  </div>
                                ) 
                                : 'Not Available'
                              ) 
                            : 'Select a Date'}
                      </Button>
                    </div>
                  </div>
                  {/* Status messages with enhanced styling */}
                  <div className="mt-4">
                    {selectedDate && isDateAvailable !== null && (
                      <div className="flex items-center text-sm bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${
                          isDateAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={isDateAvailable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {isDateAvailable ? '✨ This date is available for booking!' : '⚠️ This date is not available'}
                        </span>
                      </div>
                    )}
                    {isCheckingAvailability && (
                      <div className="flex items-center text-sm text-gray-600 bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse mr-2.5"></div>
                        Checking availability...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Requirements Section
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Special Requirements</h2>
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border border-blue-100 p-6">
                  <p className="text-gray-700 mb-4">Have specific requirements or need customizations for your event? Let us know!</p>
                  
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="decoration" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                        <label htmlFor="decoration" className="text-gray-700">Custom Decoration</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="catering" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                        <label htmlFor="catering" className="text-gray-700">Special Catering</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="tech" className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                        <label htmlFor="tech" className="text-gray-700">Tech Equipment</label>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="special-requests" className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Requirements
                      </label>
                      <textarea 
                        id="special-requests"
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                        placeholder="Please describe any special requirements or requests for your event..."
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Requirements
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">About this venue</h2>
                <p className="text-gray-600 leading-relaxed">{venue.description}</p>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {venue.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></div>
                      <span className="text-gray-700 text-sm">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simple Gallery Below */}
              <div className="mt-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((img, idx) => (
                    <div key={img.src + idx} className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={imageStatus[idx] === 'error' ? placeholderImg : img.src}
                        alt={`${venue?.name} gallery ${idx + 1}`}
                        className="object-cover w-full h-full"
                        onLoad={() => handleImgLoad(idx)}
                        onError={() => handleImgError(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VenueDetailsPage;