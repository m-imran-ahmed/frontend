import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Users, CreditCard, Building, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import { getVenueById, createBooking, checkVenueAvailability } from '../services/api';
import { useBooking } from '../context/BookingContext';
import { AuthContext } from '../context/AuthContext';
import { useVenue } from '../context/VenueContext';
import { MapPin } from 'lucide-react';
import { setToStartOfDay, setToEndOfDay, isValidBookingDate } from '../utils/dateUtils';

const BookingPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { addBooking } = useBooking();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { venue, setCurrentVenue } = useVenue();
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
  const [guestCount, setGuestCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // New form fields
  const [eventType, setEventType] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [bookingStep, setBookingStep] = useState(1);
  const [includeDecoration, setIncludeDecoration] = useState(false);
  const [includeCatering, setIncludeCatering] = useState(false);
  const [includeEquipment, setIncludeEquipment] = useState(false);

  // Fetch venue only once when component mounts or venueId changes
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchVenue = async () => {
      if (!venueId) {
        setError('No venue ID provided');
        setIsLoading(false);
        return;
      }

      // Only fetch if we don't already have the venue or if it's a different venue
      if (!venue || venue._id !== venueId) {
        setIsLoading(true);
        setError(null);
        try {
          const result = await getVenueById(venueId);
          if (!result) {
            throw new Error('Venue not found');
          }
          console.log('Venue data:', result);
          console.log('Venue location:', result.location);
          setCurrentVenue(result);
        } catch (error) {
          console.error('Error fetching venue:', error);
          setError(error.message || 'Failed to fetch venue details');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchVenue();
  }, [venueId, isAuthenticated, navigate, location.pathname, venue, setCurrentVenue]);

  const checkAvailability = useCallback(async (date) => {
    if (!date || !venue?._id) return false;

    try {
      // Use utility functions for consistent date handling
      const startDate = setToStartOfDay(new Date(date));
      const endDate = setToEndOfDay(new Date(date));

      console.log('Checking availability for booking:', {
        venueId: venue._id,
        date,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const result = await checkVenueAvailability(
        venue._id,
        startDate.toISOString(),
        endDate.toISOString()
      );

      return result.available;
    } catch (error) {
      console.error('Availability check error:', error);
      return false;
    }
  }, [venue?._id]);

  // Extract date from URL parameters and set initial state
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
      // Validate the date only once on mount if present
      (async () => {
        setIsCheckingAvailability(true);
        try {
          const isAvailable = await checkAvailability(dateParam);
          if (!isAvailable) {
            setDateError('This date is not available. Please select another date.');
          }
        } catch (error) {
          console.error('Error validating initial date:', error);
          setDateError('Error checking availability. Please try again.');
        } finally {
          setIsCheckingAvailability(false);
        }
      })();
    }
  }, []); // Only run once on mount

  const handleDateChange = useCallback(async (e) => {
    const { value } = e.target;
    setDateError(null);
    
    if (!value) {
      setSelectedDate('');
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const isAvailable = await checkAvailability(value);
      if (!isAvailable) {
        setDateError('This date is not available. Please select another date.');
        setSelectedDate('');
      } else {
        setSelectedDate(value);
      }
    } catch (error) {
      setDateError('Error checking availability. Please try again.');
      setSelectedDate('');
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [checkAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!venue || !selectedDate) {
      setDateError('Please select a date');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      // Verify availability one more time before submitting
      const isAvailable = await checkAvailability(selectedDate);
      if (!isAvailable) {
        setDateError('This date is no longer available. Please select another date.');
        setIsSubmitting(false);
        return;
      }

      const startDate = setToStartOfDay(new Date(selectedDate));
      const endDate = setToEndOfDay(new Date(selectedDate));

      console.log('Creating booking with data:', {
        venueId: venue._id,
        userId: user?._id || 'guest-user',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        guestCount,
        eventType,
        specialRequests,
        contactName,
        contactPhone,
        addons: {
          decoration: includeDecoration,
          catering: includeCatering,
          equipment: includeEquipment
        },
        paymentMethod,
        totalPrice: calculateTotalPrice()
      });

      const bookingData = {
        venueId: venue._id,
        userId: user?._id || 'guest-user',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        guestCount: guestCount,
        eventType,
        specialRequests,
        contactName,
        contactPhone,
        addons: {
          decoration: includeDecoration,
          catering: includeCatering,
          equipment: includeEquipment
        },
        paymentMethod,
        totalPrice: calculateTotalPrice(),
        status: 'confirmed'
      };

      const booking = await createBooking(bookingData);
      console.log('Booking created successfully:', booking);

      const bookingRecord = {
        id: booking._id,
        venueId: venue._id,
        venueName: venue.name,
        date: typeof selectedDate === 'string' ? selectedDate : new Date(selectedDate).toISOString().split('T')[0],
        guestCount: guestCount,
        eventType,
        totalPrice: bookingData.totalPrice,
        status: booking.status || 'confirmed',
        createdAt: booking.createdAt || new Date().toISOString(),
      };
      
      console.log('Adding booking to context:', bookingRecord);
      addBooking(bookingRecord);

      // Store booking details in localStorage as a fallback
      localStorage.setItem('lastBooking', JSON.stringify(bookingRecord));
      console.log('Stored booking in localStorage, navigating to confirmation page');

      navigate('/confirmation');
    } catch (error) {
      console.error('Booking error:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total price with add-ons
  const calculateTotalPrice = () => {
    if (!venue) return 0;
    
    let total = venue.dailyRate;
    
    // Add cost for add-ons
    if (includeDecoration) total += venue.dailyRate * 0.15;
    if (includeCatering) total += venue.dailyRate * 0.25;
    if (includeEquipment) total += venue.dailyRate * 0.10;
    
    // Add GST
    total *= 1.18;
    
    return total;
  };

  const nextStep = () => {
    if (bookingStep < 3) {
      setBookingStep(bookingStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatLocation = useCallback((location) => {
    if (typeof location === 'string') return location;
    
    // Handle address object properly
    if (location?.address) {
      const address = location.address;
      const addressParts = [];
      
      if (address.street) addressParts.push(address.street);
      if (address.city) addressParts.push(address.city);
      if (address.state) addressParts.push(address.state);
      if (address.country) addressParts.push(address.country);
      if (address.zipCode) addressParts.push(address.zipCode);
      
      return addressParts.join(', ');
    }
    
    if (location?.formattedAddress) return location.formattedAddress;
    if (location?.coordinates) return `${location.coordinates[0]}, ${location.coordinates[1]}`;
    return 'Location not available';
  }, []);

  const venueLocation = useMemo(() => {
    // First try to format the location using our helper
    const formattedLocation = formatLocation(venue?.location);
    
    // If that doesn't work, check if venue has an address property directly
    if (formattedLocation === 'Location not available' && venue?.address) {
      if (typeof venue.address === 'string') {
        return venue.address;
      } else {
        // Handle address object
        const address = venue.address;
        const addressParts = [];
        
        if (address.street) addressParts.push(address.street);
        if (address.city) addressParts.push(address.city);
        if (address.state) addressParts.push(address.state);
        if (address.country) addressParts.push(address.country);
        if (address.zipCode) addressParts.push(address.zipCode);
        
        return addressParts.join(', ');
      }
    }
    
    return formattedLocation;
  }, [venue?.location, venue?.address, formatLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-pink-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !venue) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button variant="primary" onClick={() => navigate('/venues')}>
          Browse Venues
        </Button>
      </div>
    );
  }

  const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'birthday', label: 'Birthday Party' },
    { value: 'conference', label: 'Conference' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'exhibition', label: 'Exhibition' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm mb-6 text-gray-500">
            <span className="hover:text-pink-600 cursor-pointer" onClick={() => navigate(`/venue/${venue?._id}`)}>Venue Details</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-pink-600 font-medium">Booking</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Book Your Event</h1>
            <p className="text-gray-600">Complete the form below to reserve {venue?.name}</p>
          </div>

          {/* Main content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Progress Steps */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 px-6">
              <div className="flex justify-between items-center">
                <div className={`flex flex-col items-center ${bookingStep >= 1 ? 'text-white' : 'text-white/60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${bookingStep >= 1 ? 'bg-white text-pink-600' : 'bg-white/30 text-white'}`}>1</div>
                  <span className="text-xs font-medium">Event Details</span>
                </div>
                <div className={`w-12 h-1 ${bookingStep >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
                <div className={`flex flex-col items-center ${bookingStep >= 2 ? 'text-white' : 'text-white/60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${bookingStep >= 2 ? 'bg-white text-pink-600' : 'bg-white/30 text-white'}`}>2</div>
                  <span className="text-xs font-medium">Add-ons</span>
                </div>
                <div className={`w-12 h-1 ${bookingStep >= 3 ? 'bg-white' : 'bg-white/30'}`}></div>
                <div className={`flex flex-col items-center ${bookingStep >= 3 ? 'text-white' : 'text-white/60'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${bookingStep >= 3 ? 'bg-white text-pink-600' : 'bg-white/30 text-white'}`}>3</div>
                  <span className="text-xs font-medium">Payment</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Venue and Event Details */}
                {bookingStep === 1 && (
                  <div className="space-y-6">
                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-6">
                      <div className="flex items-start">
                        <Building className="h-5 w-5 text-pink-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-800">{venue?.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            {venueLocation}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Date*
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg ${
                              dateError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-pink-500'
                            } focus:outline-none focus:ring-2 focus:ring-pink-200`}
                            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={handleDateChange}
                            required
                          />
                        </div>
                        {dateError && <p className="mt-1 text-sm text-red-600">{dateError}</p>}
                        {isCheckingAvailability && (
                          <p className="mt-1 text-sm text-gray-600 flex items-center">
                            <span className="w-3 h-3 bg-pink-500 rounded-full animate-pulse mr-2"></span>
                            Checking availability...
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
                          Event Type*
                        </label>
                        <div className="relative">
                          <select
                            id="event_type"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 appearance-none"
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            required
                          >
                            <option value="" disabled>Select event type</option>
                            {eventTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="guest_count" className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Guests*
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="guest_count"
                            type="number"
                            min="1"
                            max={venue?.capacity || 1000}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                            value={guestCount}
                            onChange={(e) => setGuestCount(parseInt(e.target.value))}
                            required
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Maximum capacity: {venue?.capacity || 'N/A'}</p>
                      </div>

                      <div>
                        <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Person*
                        </label>
                        <input
                          id="contact_name"
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Phone*
                        </label>
                        <input
                          id="contact_phone"
                          type="tel"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="Phone number"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button
                        type="button"
                        variant="primary"
                        className="px-8"
                        onClick={nextStep}
                        disabled={!selectedDate || !eventType || !contactName || !contactPhone}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Add-ons */}
                {bookingStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">Enhance Your Event</h3>
                      <p className="text-gray-600 mb-6">Customize your experience with these additional services</p>
                      
                      <div className="space-y-5">
                        <div className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
                          <input
                            type="checkbox"
                            id="decoration"
                            className="h-5 w-5 mt-0.5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            checked={includeDecoration}
                            onChange={(e) => setIncludeDecoration(e.target.checked)}
                          />
                          <div className="ml-3">
                            <label htmlFor="decoration" className="font-medium text-gray-800 block mb-1">
                              Custom Decoration
                            </label>
                            <p className="text-sm text-gray-600">Professional decoration services tailored to your event theme</p>
                            <p className="text-sm font-medium text-pink-600 mt-1">+{formatCurrency(venue?.dailyRate * 0.15)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
                          <input
                            type="checkbox"
                            id="catering"
                            className="h-5 w-5 mt-0.5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            checked={includeCatering}
                            onChange={(e) => setIncludeCatering(e.target.checked)}
                          />
                          <div className="ml-3">
                            <label htmlFor="catering" className="font-medium text-gray-800 block mb-1">
                              Premium Catering
                            </label>
                            <p className="text-sm text-gray-600">Delicious menu options with professional service staff</p>
                            <p className="text-sm font-medium text-pink-600 mt-1">+{formatCurrency(venue?.dailyRate * 0.25)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
                          <input
                            type="checkbox"
                            id="equipment"
                            className="h-5 w-5 mt-0.5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            checked={includeEquipment}
                            onChange={(e) => setIncludeEquipment(e.target.checked)}
                          />
                          <div className="ml-3">
                            <label htmlFor="equipment" className="font-medium text-gray-800 block mb-1">
                              Technical Equipment
                            </label>
                            <p className="text-sm text-gray-600">Professional sound, lighting, and projection systems</p>
                            <p className="text-sm font-medium text-pink-600 mt-1">+{formatCurrency(venue?.dailyRate * 0.10)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requests
                      </label>
                      <textarea
                        id="special_requests"
                        rows="4"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Any special requirements or requests for your event..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-8"
                        onClick={prevStep}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        className="px-8"
                        onClick={nextStep}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {bookingStep === 3 && (
                  <div>
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100 p-6 mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                          <span className="text-gray-600">Basic Rate</span>
                          <span className="font-medium">{formatCurrency(venue?.dailyRate || 0)}</span>
                        </div>
                        
                        {includeDecoration && (
                          <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                            <span className="text-gray-600">Custom Decoration</span>
                            <span className="font-medium">+{formatCurrency(venue?.dailyRate * 0.15)}</span>
                          </div>
                        )}
                        
                        {includeCatering && (
                          <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                            <span className="text-gray-600">Premium Catering</span>
                            <span className="font-medium">+{formatCurrency(venue?.dailyRate * 0.25)}</span>
                          </div>
                        )}
                        
                        {includeEquipment && (
                          <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                            <span className="text-gray-600">Technical Equipment</span>
                            <span className="font-medium">+{formatCurrency(venue?.dailyRate * 0.10)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                          <span className="text-gray-600">GST (18%)</span>
                          <span className="font-medium">{formatCurrency((calculateTotalPrice() / 1.18) * 0.18)}</span>
                        </div>
                        
                        <div className="flex justify-between py-2 text-lg font-bold">
                          <span className="text-gray-800">Total</span>
                          <span className="text-pink-600">{formatCurrency(calculateTotalPrice())}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p>• 50% deposit is required to confirm booking</p>
                        <p>• Final payment due 7 days before event</p>
                        <p>• Free cancellation until 24h before event</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
                          <input
                            type="radio"
                            id="credit_card"
                            name="payment_method"
                            value="credit_card"
                            className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300"
                            checked={paymentMethod === 'credit_card'}
                            onChange={() => setPaymentMethod('credit_card')}
                          />
                          <label htmlFor="credit_card" className="ml-3 font-medium text-gray-800 flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                            Credit or Debit Card
                          </label>
                        </div>
                        
                        <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
                          <input
                            type="radio"
                            id="upi"
                            name="payment_method"
                            value="upi"
                            className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300"
                            checked={paymentMethod === 'upi'}
                            onChange={() => setPaymentMethod('upi')}
                          />
                          <label htmlFor="upi" className="ml-3 font-medium text-gray-800">
                            UPI Payment
                          </label>
                        </div>
                        
                        <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
                          <input
                            type="radio"
                            id="netbanking"
                            name="payment_method"
                            value="netbanking"
                            className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300"
                            checked={paymentMethod === 'netbanking'}
                            onChange={() => setPaymentMethod('netbanking')}
                          />
                          <label htmlFor="netbanking" className="ml-3 font-medium text-gray-800">
                            Net Banking
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-8">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-8"
                        onClick={prevStep}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="px-8"
                        isLoading={isSubmitting}
                      >
                        Complete Booking
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;