import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { VenueProvider } from './context/VenueContext';
import Navbar from './components/common/Navbar';
import ScrollToTop from './components/common/ScrollToTop';
import PageTransition from './components/common/PageTransition';
import HomePage from './pages/HomePage';
import VenueListPage from './pages/VenueListPage';
import VenueDetailsPage from './pages/VenueDetailsPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ApiTestPage from './pages/ApiTestPage';
import PrivateRoute from './components/common/PrivateRoute';

// Future flags for React Router v7
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <Router {...router}>
      <AuthProvider>
        <VenueProvider>
          <BookingProvider>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50 pt-20">
              <Navbar />
              <PageTransition>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  
                  {/* Venue routes */}
                  <Route path="/venues" element={<VenueListPage />} />
                  <Route path="/venues/area/:area" element={<VenueListPage />} />
                  <Route path="/venues/:venueId" element={<VenueDetailsPage />} />
                  <Route path="/venue/:id" element={<VenueDetailsPage />} />
                  
                  {/* Testing route */}
                  <Route path="/api-test" element={<ApiTestPage />} />
                  
                  <Route
                    path="/booking/:venueId"
                    element={
                      <PrivateRoute>
                        <BookingPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/confirmation"
                    element={
                      <PrivateRoute>
                        <ConfirmationPage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/dashboard/*"
                    element={
                      <PrivateRoute>
                        <DashboardPage />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </PageTransition>
            </div>
          </BookingProvider>
        </VenueProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
