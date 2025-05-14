import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchUserBookings, rescheduleBooking as apiRescheduleBooking } from '../services/api';
import { AuthContext } from './AuthContext';
import { setToStartOfDay, setToEndOfDay, formatDateToISO } from '../utils/dateUtils';

export const BookingContext = createContext({
  currentBooking: null,
  userBookings: [],
  setCurrentBooking: () => {},
  addBooking: () => {},
  cancelBooking: () => {},
  rescheduleBooking: () => {},
  clearBookings: () => {},
});

export const BookingProvider = ({ children }) => {
  // Initialize state 
  const [currentBooking, setCurrentBooking] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const { user } = useContext(AuthContext);
  const [userId, setUserId] = useState(null);

  // Set user ID when user changes
  useEffect(() => {
    if (user?._id) {
      setUserId(user._id);
      localStorage.setItem('lastUserId', user._id);
    } else {
      // When logged out, try to get the last user ID
      const lastUserId = localStorage.getItem('lastUserId');
      if (lastUserId) {
        setUserId(lastUserId);
      }
    }
  }, [user]);

  // Modified: Reset state but don't clear localStorage
  const clearBookings = () => {
    setCurrentBooking(null);
    setUserBookings([]);
    // We don't remove localStorage - intentional
  };

  // This effect runs when userId changes (either from active user or lastUserId)
  useEffect(() => {
    if (!userId) return;
    
    console.log('Loading bookings for user ID:', userId);
    
    // Try to load bookings from localStorage first for immediate display
    const savedBookings = localStorage.getItem(`userBookings-${userId}`);
    if (savedBookings) {
      try {
        const parsedBookings = JSON.parse(savedBookings);
        setUserBookings(parsedBookings);
        console.log('Loaded bookings from localStorage:', parsedBookings.length);
      } catch (e) {
        console.error('Error parsing bookings from localStorage:', e);
      }
    }
    
    // Try to load current booking from localStorage
    const savedCurrentBooking = localStorage.getItem(`currentBooking-${userId}`);
    if (savedCurrentBooking) {
      try {
        const parsedCurrentBooking = JSON.parse(savedCurrentBooking);
        setCurrentBooking(parsedCurrentBooking);
      } catch (e) {
        console.error('Error parsing current booking from localStorage:', e);
      }
    }
    
    // Then try to load from API if user is logged in
    if (user?._id === userId) {
      loadBookingsFromAPI(userId);
    }
  }, [userId, user]);

  // Separate function to load bookings from API
  const loadBookingsFromAPI = async (id) => {
    if (!id) return;
    
    try {
      console.log('Fetching bookings from API for user:', id);
        const bookings = await fetchUserBookings();
      
      if (!bookings || bookings.length === 0) {
        console.log('No bookings found from API');
        return;
      }
      
      console.log('Received bookings from API:', bookings.length);
      
      const formattedBookings = bookings.map(booking => ({
          id: booking._id,
          venueId: booking.venueId,
          venueName: booking.venueName,
          date: new Date(booking.startDate).toISOString().split('T')[0],
          guestCount: booking.guestCount,
          totalPrice: booking.totalPrice,
          status: booking.status,
          createdAt: booking.createdAt,
      }));
      
      // Update state with new bookings
      setUserBookings(formattedBookings);
      
      // Save to localStorage with user ID in the key
      localStorage.setItem(`userBookings-${id}`, JSON.stringify(formattedBookings));
      console.log('Saved bookings to localStorage for user:', id);
      } catch (error) {
      console.error('Error loading user bookings from API:', error);
    }
  };
  
  // Save bookings to localStorage whenever they change
  useEffect(() => {
    if (userBookings.length > 0 && userId) {
      localStorage.setItem(`userBookings-${userId}`, JSON.stringify(userBookings));
      console.log('Updated localStorage with bookings for user:', userId);
    }
  }, [userBookings, userId]);
  
  // Save current booking to localStorage whenever it changes
  useEffect(() => {
    if (currentBooking && userId) {
      localStorage.setItem(`currentBooking-${userId}`, JSON.stringify(currentBooking));
    }
  }, [currentBooking, userId]);

  const addBooking = (booking) => {
    console.log('Adding booking to context:', booking);
    
    // Ensure booking has all required fields
    const formattedBooking = {
      ...booking,
      // Ensure date is in YYYY-MM-DD format
      date: booking.date || (booking.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : null)
    };
    
    console.log('Formatted booking:', formattedBooking);
    
    setUserBookings(prevBookings => {
      // Check if booking already exists
      const exists = prevBookings.some(b => b.id === formattedBooking.id);
      if (exists) {
        return prevBookings.map(b => b.id === formattedBooking.id ? formattedBooking : b);
      }
      return [...prevBookings, formattedBooking];
    });
    
    setCurrentBooking(formattedBooking);
  };

  const cancelBooking = (bookingId) => {
    setUserBookings(prevBookings =>
      prevBookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' }
          : booking
      )
    );
    
    // If this was the current booking, update its status too
    if (currentBooking && currentBooking.id === bookingId) {
      setCurrentBooking(prev => ({
        ...prev,
        status: 'cancelled'
      }));
    }
  };

  const rescheduleBooking = async (bookingId, newDate) => {
    try {
      console.log('Rescheduling booking:', bookingId, 'to new date:', newDate);
      
      // Convert date string to proper date objects for API
      const startDate = setToStartOfDay(new Date(newDate));
      const endDate = setToEndOfDay(new Date(newDate));

      console.log('Formatted dates for API:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Call the backend API to reschedule if user is logged in
      if (user?._id) {
      const response = await apiRescheduleBooking(
        bookingId, 
        startDate.toISOString(), 
        endDate.toISOString()
      );
      console.log('Rescheduling response from server:', response);
      }
      
      // Update the booking in the local state regardless of API call
      setUserBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { 
                ...booking, 
                date: newDate,
                status: 'confirmed' // Reset status to confirmed after rescheduling
              }
            : booking
        )
      );

      // If this was the current booking, update it too
      if (currentBooking && currentBooking.id === bookingId) {
        setCurrentBooking(prev => ({
          ...prev,
          date: newDate,
          status: 'confirmed'
        }));
      }

      return { success: true };
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      // Re-throw the error so it can be caught by the component
      throw error;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        currentBooking,
        userBookings,
        setCurrentBooking,
        addBooking,
        cancelBooking,
        rescheduleBooking,
        clearBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
