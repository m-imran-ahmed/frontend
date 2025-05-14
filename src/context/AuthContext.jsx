import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  api, 
  loginUser as apiLoginUser, 
  registerUser as apiRegisterUser, 
  getCurrentUser as apiGetCurrentUser,
  updateUserProfile as apiUpdateUserProfile 
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token in axios header
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Check for stored token on mount and fetch user data
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        setAuthToken(token);
        
        try {
          const response = await apiGetCurrentUser();
          
          if (response.success) {
            setUser(response.user);
          } else {
            // If token is invalid, clean up
            setToken(null);
            setUser(null);
            setAuthToken(null);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          setToken(null);
          setUser(null);
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiLoginUser(email, password);
      
      if (response.success) {
        const { token, user } = response;
        
        // Set token in localStorage and axios headers
        setAuthToken(token);
        setToken(token);
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password, phone) => {
    setError(null);
    try {
      const response = await apiRegisterUser(name, email, password, phone);
      
      if (response.success) {
        const { token, user } = response;
        
        // Set token in localStorage and axios headers
        setAuthToken(token);
        setToken(token);
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Store the user ID before logging out (for bookings persistence)
    if (user?._id) {
      localStorage.setItem('lastUserId', user._id);
    }
    
    // Clear user data and token
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await apiUpdateUserProfile(userData);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
export default AuthContext;
