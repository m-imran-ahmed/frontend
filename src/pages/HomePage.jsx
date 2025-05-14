import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Calendar, Star, ArrowRight, Heart } from 'lucide-react';
import Button from '../components/common/Button';
import { fetchPopularVenues, testBackendConnection, fetchAllVenues } from '../services/api';
import { venueImages } from '../assets/images';
import HeroSection from '../components/common/HeroSection';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [popularVenues, setPopularVenues] = useState([]);
  const [allVenues, setAllVenues] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const isConnected = await testBackendConnection();
        if (!isConnected) {
          throw new Error('Cannot connect to backend server');
        }

        const [popularData, allData] = await Promise.all([
          fetchPopularVenues(),
          fetchAllVenues()
        ]);
        setPopularVenues(popularData);
        setAllVenues(allData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filteredSuggestions = allVenues.filter(venue => 
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.type?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allVenues]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/venues?search=${searchQuery.trim()}`);
    }
  };

  const handleSuggestionClick = (venue) => {
    setSearchQuery(venue.name);
    setShowSuggestions(false);
    navigate(`/venue/${venue._id}`);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleVenueClick = (venueId) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/venue/${venueId}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        <HeroSection />
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 mt-8 mb-8"></div>

      {/* Popular Venues Section */}
      <div className="relative bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Popular Venues</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most sought-after venues, handpicked for their exceptional beauty and service
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-16 h-16 border-4 border-t-pink-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularVenues.map((venue) => (
                <div 
                  key={venue._id} 
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group relative transform hover:-translate-y-2 border border-gray-100"
                  onClick={() => handleVenueClick(venue._id)}
                >
                  {/* Badge for venue type */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-pink-600 rounded-full text-xs font-semibold shadow-sm">
                      {venue.type}
                    </span>
                  </div>

                  {/* Image container with gradient overlay */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={venueImages[venue.name] || venue.imageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-80"></div>
                    
                    {/* Quick facts bottom overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white text-sm font-medium">{formatLocation(venue)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white text-sm font-medium">{venue.capacity}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content section */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors duration-300">{venue.name}</h3>
                    </div>
                    
                    {/* Amenities/features */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {venue.amenities ? (
                        venue.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                            {amenity}
                          </span>
                        ))
                      ) : (
                        <>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                            Parking
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                            Catering
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                            {venue.type}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Price and action */}
                    <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-pink-600">₹{venue.dailyRate?.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm ml-1">per day</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay for detailed pricing - only visible on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <div className="text-white text-center p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-xs uppercase tracking-wider bg-pink-600/80 px-2 py-1 rounded-full">Premium Venue</span>
                      <h4 className="text-2xl font-bold mt-4 mb-2">{venue.name}</h4>
                      <div className="space-y-2 max-w-xs mx-auto">
                        <p className="text-4xl font-bold text-white">₹{venue.dailyRate?.toLocaleString()}</p>
                        <p className="text-base text-pink-200 pb-2">per day</p>
                        
                        <div className="pt-4">
                          <button className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all">
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate('/venues')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
            >
              View All Venues
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 relative inline-block">
              How It Works
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span>
            </h2>
            <p className="text-gray-500 mt-2">Simple steps to find and book your perfect venue</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-pink-200 group">
              <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-300">
                <Search className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center group-hover:text-pink-600 transition-colors duration-300">Search</h3>
              <p className="text-gray-500 text-center text-sm">
                Browse through our curated list of venues
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-purple-200 group">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
                <Calendar className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center group-hover:text-purple-600 transition-colors duration-300">Book</h3>
              <p className="text-gray-500 text-center text-sm">
                Select your preferred date and time
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-pink-200 group">
              <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-300">
                <Star className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center group-hover:text-pink-600 transition-colors duration-300">Review</h3>
              <p className="text-gray-500 text-center text-sm">
                Read reviews and check venue details
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-purple-200 group">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center group-hover:text-purple-600 transition-colors duration-300">Celebrate</h3>
              <p className="text-gray-500 text-center text-sm">
                Enjoy your special day at your dream venue
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 relative inline-block">
              Why Choose Us
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span>
            </h2>
            <p className="text-gray-500 mt-2">Discover what makes us the perfect choice for your special day</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-pink-200 group">
              <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-300">
                <Search className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors duration-300">Wide Selection</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Choose from hundreds of carefully curated venues across the city
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-purple-200 group">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
                <Calendar className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-300">Easy Booking</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Simple and secure booking process with instant confirmation
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-pink-200 group">
              <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-300">
                <Star className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors duration-300">Best Prices</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Competitive rates and transparent pricing with no hidden fees
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50 hover:border-purple-200 group">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-300">24/7 Support</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Dedicated support team available round the clock to assist you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="relative bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Company Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-800">FindMyVenue</h3>
              <p className="text-gray-600 text-sm">Your trusted partner in finding the perfect venue for your special occasions.</p>
              <div className="flex space-x-2">
                <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-pink-100 transition-colors duration-300">
                  <svg className="w-3.5 h-3.5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-pink-100 transition-colors duration-300">
                  <svg className="w-3.5 h-3.5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-pink-100 transition-colors duration-300">
                  <svg className="w-3.5 h-3.5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-3">Quick Links</h4>
              <ul className="space-y-1.5">
                <li><a href="#" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 text-sm">Home</a></li>
                <li><a href="#" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 text-sm">Venues</a></li>
                <li><a href="#" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 text-sm">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-pink-600 transition-colors duration-300 text-sm">Contact</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-3">Contact Us</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600 text-sm">
                  <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <span>+91 8798321721</span>
                </li>
                <li className="flex items-center text-gray-600 text-sm group">
                  <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center mr-2 group-hover:bg-pink-100 transition-colors duration-300">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <span className="group-hover:text-pink-600 transition-colors duration-300">contact@findmyvenue.com</span>
                </li>
                <li className="flex items-center text-gray-600 text-sm">
                  <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span>Hyderabad, India</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-3">Newsletter</h4>
              <p className="text-gray-600 text-sm mb-2">Subscribe to get updates on new venues and special offers.</p>
              <form className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 mt-4 pt-3 text-center">
            <p className="text-gray-600 text-sm">&copy; 2024 FindMyVenue. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;