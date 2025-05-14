import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, List, User, Settings, LogOut, Edit, X, AlertCircle, MapPin, Users, ChevronRight, Star, Building2, CheckCircle, Home } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import BookingContext from '../context/BookingContext';
import Footer from '../components/common/Footer';
import { fetchUserBookings } from '../services/api';
import { checkVenueAvailability, cancelBooking as apiCancelBooking, rescheduleBooking } from '../services/api';
import { setToStartOfDay, setToEndOfDay, formatDateForDisplay } from '../utils/dateUtils';

// Dashboard components
const ViewBookings = () => {
  const { userBookings, addBooking, cancelBooking, rescheduleBooking, clearBookings } = useContext(BookingContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Set loading state to false after bookings are loaded or timeout
  useEffect(() => {
    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // If we have bookings, set loading to false immediately
    if (userBookings && userBookings.length > 0) {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [userBookings]);

  const handleLogout = () => {
    // Reset state but preserve localStorage
    clearBookings();
    logout();
    navigate('/login');
  };

  const handleCancelClick = async (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (selectedBookingId) {
      try {
        // Call the API to cancel the booking if user is logged in
        if (user?._id) {
          const response = await apiCancelBooking(selectedBookingId);
          console.log('Booking cancelled on server:', response);
        }
        
        // Update local state regardless of API result
        cancelBooking(selectedBookingId);
        setShowCancelModal(false);
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  const handleRescheduleClick = (bookingId) => {
    const booking = userBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setSelectedBookingId(bookingId);
      setShowRescheduleModal(true);
    } else {
      console.error('Booking not found with ID:', bookingId);
    }
  };

  const checkAvailability = async (date) => {
    if (!date || !selectedBooking) return false;
    
    setIsCheckingAvailability(true);
    try {
      const startDate = setToStartOfDay(new Date(date));
      const endDate = setToEndOfDay(new Date(date));

      // Only check availability on server if logged in
      if (user?._id) {
        const { available, reason } = await checkVenueAvailability(
          selectedBooking.venueId,
          startDate.toISOString(),
          endDate.toISOString()
        );

        if (!available) {
          alert(reason || 'This date is not available. Please select another date.');
          setNewDate('');
          return false;
        }
        return available;
      } else {
        // If not logged in, just allow any date selection
        // This will be properly checked when they log in again
        return true;
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      // Still allow date selection if there's an error checking
      return true;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setNewDate(date);

    if (date) {
      const isAvailable = await checkAvailability(date);
      if (!isAvailable) {
        alert('This date is not available. Please select another date.');
        setNewDate('');
      }
    }
  };

  const handleReschedule = async () => {
    if (!newDate) {
      alert('Please select a new date');
      return;
    }

    try {
      const result = await rescheduleBooking(selectedBookingId, newDate);
      
      if (result.success) {
        setShowRescheduleModal(false);
        setNewDate('');
        setSelectedBooking(null);
        
        // Show confirmation notification
        alert(`Your booking has been successfully rescheduled to ${formatDateForDisplay(newDate)}`);
      } else {
        alert('Failed to reschedule booking. Please try again.');
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to reschedule booking. Please try again.');
      }
    }
  };

  // Display bookings from context
  const bookingsToDisplay = userBookings;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Bookings</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-3">Welcome back, {user?.name?.split(' ')[0] || 'Guest'}!</h2>
        <p className="text-pink-100 text-lg">Manage your bookings and explore new venues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-800">{bookingsToDisplay.length}</p>
              <p className="text-sm text-gray-500 mt-1">Across all venues</p>
            </div>
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-pink-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-800">
                {bookingsToDisplay.filter(b => b.status === 'confirmed').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Ready for your events</p>
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Your Bookings</h3>
        </div>
        {bookingsToDisplay.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bookingsToDisplay.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{booking.venueName}</h3>
                      <span 
                        className={`ml-3 px-3 py-1 rounded-full text-xs font-medium
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-5 text-sm text-gray-600">
                      <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Calendar className="h-4 w-4 text-pink-500 mr-2" />
                        <span>
                          {formatDateForDisplay(booking.date)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Users className="h-4 w-4 text-pink-500 mr-2" />
                        <span>{booking.guestCount} guests</span>
                      </div>
                      <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                        <span className="font-medium text-gray-800">₹{booking.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      icon={<Edit className="h-4 w-4" />}
                      className={`shadow-sm hover:shadow ${booking.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200'}`}
                      disabled={booking.status === 'cancelled'}
                      onClick={() => booking.status !== 'cancelled' && handleRescheduleClick(booking.id)}
                    >
                      Reschedule
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`shadow-sm hover:shadow text-red-600 border-red-200 hover:bg-red-50 ${booking.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      icon={<X className="h-4 w-4" />}
                      onClick={() => booking.status !== 'cancelled' && handleCancelClick(booking.id)}
                      disabled={booking.status === 'cancelled'}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't made any bookings yet. Start exploring venues to make your first booking!
            </p>
            <Button 
              variant="primary" 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate('/venues');
              }}
              className="group shadow-md hover:shadow-lg"
            >
              Browse Venues
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="shadow-sm hover:shadow"
              >
                No, Keep It
              </Button>
              <Button 
                variant="danger"
                onClick={confirmCancel}
                className="shadow-sm hover:shadow"
              >
                Yes, Cancel Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Booking Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reschedule Booking</h3>
            <p className="text-gray-600 mb-4">
              Select a new date for your booking at {selectedBooking?.venueName}
            </p>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Date
              </label>
              <div className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600">
                {selectedBooking?.date ? formatDateForDisplay(selectedBooking.date) : 'Unknown'}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={newDate}
                  onChange={handleDateChange}
                  min="2025-05-08"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
                  required
                  disabled={isCheckingAvailability}
                />
                {isCheckingAvailability && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-t-pink-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <Calendar className="h-3 w-3 mr-1" /> Bookings are available from May 8, 2025 onwards
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <X className="h-3 w-3 mr-1" /> Venue is closed on Mondays
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setNewDate('');
                  setSelectedBooking(null);
                }}
                className="shadow-sm hover:shadow"
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleReschedule}
                disabled={!newDate || isCheckingAvailability}
                className="shadow-sm hover:shadow"
              >
                Reschedule Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileSettings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { clearBookings } = useContext(BookingContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    setIsUpdating(true);
    setMessage(null);
    
    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setIsUpdating(true);
    setMessage(null);
    
    try {
      const result = await updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating password' });
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    // Reset state but preserve localStorage
    clearBookings();
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-3">Profile Settings</h2>
        <p className="text-pink-100 text-lg">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5 mr-2" /> : 
            <AlertCircle className="w-5 h-5 mr-2" />
          }
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
        </div>
        <form onSubmit={handleProfileUpdate} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isUpdating}
              className="shadow-md hover:shadow-lg"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : 'Update Profile'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordUpdate} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button 
              variant="primary" 
              type="submit"
              disabled={isUpdating || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="shadow-md hover:shadow-lg"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Account Management</h3>
        </div>
        <div className="p-6">
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 shadow-sm hover:shadow"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 shadow-sm hover:shadow"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { clearBookings } = useContext(BookingContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Reset state but preserve localStorage
    clearBookings();
    logout();
    navigate('/login');
  };

  const getActivePath = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') return 'bookings';
    if (path.includes('/settings')) return 'settings';
    return 'bookings';
  };

  const activePath = getActivePath();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24 border border-gray-100">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mr-3 shadow-md">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-lg">{user?.name || 'Guest'}</p>
                    <p className="text-gray-500 text-sm">{user?.email || 'Not logged in'}</p>
                  </div>
                </div>
              </div>
              <nav className="space-y-2">
                <Link 
                  to="/dashboard" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                    activePath === 'bookings' 
                      ? 'bg-pink-50 text-pink-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  <span className="font-medium">My Bookings</span>
                </Link>
                <Link 
                  to="/dashboard/settings" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                    activePath === 'settings' 
                      ? 'bg-pink-50 text-pink-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span className="font-medium">Profile Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
                <Link
                  to="/"
                  className="w-full flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <Home className="h-5 w-5 mr-3" />
                  <span className="font-medium">Back to Home</span>
                </Link>
              </nav>
            </div>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<ViewBookings />} />
              <Route path="/settings" element={<ProfileSettings />} />
            </Routes>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;