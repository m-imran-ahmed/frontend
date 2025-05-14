import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CalendarCheck, MapPin, Clock, Users, ArrowLeft, Home, Layers } from 'lucide-react';
import Button from '../components/common/Button';
import BookingContext from '../context/BookingContext';
import { getVenueById } from '../services/api';
import Footer from '../components/common/Footer';

const ConfirmationPage = () => {
  const { currentBooking, userBookings } = useContext(BookingContext);
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run once on mount
    let isMounted = true;
    const loadVenue = async () => {
      if (!isMounted) return;
      console.log('Loading venue in ConfirmationPage');
      console.log('Current booking from context:', currentBooking);
      console.log('User bookings from context:', userBookings);
      
      let bookingToUse = null;
      if (currentBooking && currentBooking.venueId) {
        bookingToUse = currentBooking;
      } else if (userBookings.length > 0) {
        bookingToUse = userBookings[userBookings.length - 1];
      } else {
        const localBooking = localStorage.getItem('lastBooking');
        if (localBooking) {
          bookingToUse = JSON.parse(localBooking);
        }
      }
      if (!bookingToUse) {
        setIsLoading(false);
        return;
      }
      try {
        const venueData = await getVenueById(bookingToUse.venueId);
        if (isMounted) setVenue(venueData);
      } catch (error) {
        console.error('Error loading venue:', error);
      }
      setIsLoading(false);
    };
    loadVenue();
    return () => { isMounted = false; };
  }, []); // Only run once

  const handleViewVenue = (venueId) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/venues/${venueId}`);
  };

  const handleGoToDashboard = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-pink-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Use either current booking or latest booking or localStorage booking
  const getBookingData = () => {
    if (currentBooking && currentBooking.venueId) return currentBooking;
    if (userBookings.length > 0) return userBookings[userBookings.length - 1];
    const localBooking = localStorage.getItem('lastBooking');
    if (localBooking) return JSON.parse(localBooking);
    return null;
  };
  const booking = getBookingData();
  // Ensure booking.date is always a string
  const bookingDate = booking && booking.date
    ? new Date(booking.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Date not specified';

  if (!booking || !venue) {
    return (
      <div className="page-container text-center py-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Booking Information</h2>
        <p className="text-gray-600 mb-8">
          There is no active booking to display.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="page-container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Success Banner */}
              <div className="bg-green-50 p-6 flex flex-col items-center text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600">
                  Your booking for {venue.name} has been successfully confirmed.
                </p>
                <div className="bg-white shadow-sm rounded-md px-4 py-2 mt-4">
                  <span className="font-medium">Booking ID:</span> {booking.id}
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex">
                    <CalendarCheck className="h-5 w-5 text-pink-600 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Date</p>
                      <p className="text-gray-600">{bookingDate}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <Users className="h-5 w-5 text-pink-600 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Guests</p>
                      <p className="text-gray-600">{booking.guestCount} people</p>
                    </div>
                  </div>

                  <div className="flex">
                    <MapPin className="h-5 w-5 text-pink-600 mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Venue</p>
                      <p className="text-gray-600">{venue.name}</p>
                      <p className="text-gray-600">{venue.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-md mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-bold text-gray-800">₹{booking.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Status</span>
                    <span className="text-green-600 font-medium">Paid</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-8">
                  {/* <p>A confirmation email has been sent to your email address with all the details of your booking.</p> */}
                  <p className="mt-2">If you have any questions or need to make changes to your booking, please contact our support team or visit your dashboard.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="primary" 
                    icon={<Home className="h-5 w-5" />}
                    onClick={() => navigate('/')}
                  >
                    Back to Home
                  </Button>

                  <Button 
                    variant="secondary" 
                    icon={<Layers className="h-5 w-5" />}
                    onClick={handleGoToDashboard}
                  >
                    Go to Dashboard
                  </Button>

                  <Button 
                    variant="outline" 
                    icon={<ArrowLeft className="h-5 w-5" />}
                    onClick={() => handleViewVenue(venue._id)}
                  >
                    Book Another Venue
                  </Button>
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

export default ConfirmationPage;