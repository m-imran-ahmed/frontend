import axios from 'axios';

const API_BASE_URL = 'http://localhost:5005/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (name, email, password, phone) => {
  try {
    const response = await api.post('/auth/register', { name, email, password, phone });
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/auth/update-profile', userData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await api.get('/test');
    console.log('Backend connection test:', response.data);
    return true;
  } catch (error) {
    console.error('Backend connection test failed:', error.message);
    return false;
  }
};

export const fetchAllVenues = async () => {
  try {
    console.log('Fetching all venues...');
    const response = await api.get('/venues');
    console.log('Venues fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching venues:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
    }
    throw error;
  }
};

export const fetchPopularVenues = async (options = {}) => {
  try {
    const { sortBy, minPrice, maxPrice, minCapacity, maxCapacity, limit } = options;
    const params = new URLSearchParams();
    
    if (sortBy) params.append('sortBy', sortBy);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (minCapacity) params.append('minCapacity', minCapacity);
    if (maxCapacity) params.append('maxCapacity', maxCapacity);
    if (limit) params.append('limit', limit);

    const response = await api.get('/venues/popular?' + params.toString());
    console.log('Popular venues fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching popular venues:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
    }
    throw error;
  }
};

export const getVenueById = async (id) => {
  try {
    // Validate ID before making the API call
    if (!id) {
      throw new Error('Venue ID is required');
    }
    
    console.log('Fetching venue by ID:', id);
    const response = await api.get(`/venues/${id}`);
    console.log('Venue fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching venue:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Is the backend server running?');
    }
    throw error;
  }
};

export const fetchUserBookings = async () => {
  try {
    console.log('Fetching bookings for current user');
    const response = await api.get(`/bookings/user`);
    console.log('User bookings fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    console.log('Creating booking:', bookingData);
    const response = await api.post('/bookings', bookingData);
    console.log('Booking created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    console.log('Cancelling booking:', bookingId);
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    console.log('Booking cancelled successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Get all amenities
export const fetchAmenities = async () => {
  try {
    const response = await api.get('/amenities');
    return response.data;
  } catch (error) {
    console.error('Error fetching amenities:', error);
    throw error;
  }
};

// Get amenities by category
export const fetchAmenitiesByCategory = async (category) => {
  try {
    const response = await api.get('/amenities/category/' + category);
    return response.data;
  } catch (error) {
    console.error('Error fetching amenities by category:', error);
    throw error;
  }
};

// Search venues by location
export const searchVenuesByLocation = async (lat, lng, radius) => {
  try {
    const params = new URLSearchParams({ lat, lng });
    if (radius) params.append('radius', radius);
    
    const response = await api.get('/venues/search/location?' + params.toString());
    return response.data;
  } catch (error) {
    console.error('Error searching venues by location:', error);
    throw error;
  }
};

export const checkVenueAvailability = async (venueId, startDate, endDate) => {
  try {
    console.log('Checking venue availability:', {
      venueId,
      startDate,
      endDate
    });

    const response = await api.get('/bookings/check-availability', {
      params: { venueId, startDate, endDate }
    });
    
    console.log('Availability response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking venue availability:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    // Return a default response to prevent UI errors
    return { available: false, reason: 'Error checking availability' };
  }
};

export const rescheduleBooking = async (bookingId, startDate, endDate) => {
  try {
    console.log(`API: Rescheduling booking ${bookingId} with dates:`, {
      startDate,
      endDate
    });
    
    const response = await api.put(`/bookings/${bookingId}/reschedule`, {
      startDate,
      endDate
    });
    
    console.log('API: Reschedule response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error rescheduling booking:', error);
    if (error.response) {
      console.error('API: Response data:', error.response.data);
      console.error('API: Response status:', error.response.status);
    } else if (error.request) {
      console.error('API: No response received. Is the backend server running?');
    }
    throw error;
  }
};

// Direct fetch test to check if backend server is running
export const testDirectFetch = async () => {
  try {
    // Using direct fetch instead of axios to test basic connectivity
    const response = await fetch('http://localhost:5003/api/test');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Direct fetch test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Direct fetch test failed:', error.message);
    return { success: false, error: error.message };
  }
}; 