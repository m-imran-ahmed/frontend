import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllVenues } from '../../services/api';
import { venueImages } from '../../assets/images';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [venues, setVenues] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch venues for suggestions
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const data = await fetchAllVenues();
        setVenues(data);
      } catch (error) {
        console.error('Error loading venues for suggestions:', error);
      }
    };
    loadVenues();
  }, []);

  // Update suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = venues.filter(venue => {
        const venueArea = formatLocation(venue);
        return venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               venueArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (venue.type && venue.type.toLowerCase().includes(searchQuery.toLowerCase()));
      }).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, venues]);

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

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/venues?search=${searchQuery.trim()}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setIsMenuOpen(false);
    }
  };

  const handleSuggestionClick = (venue) => {
    setSearchQuery(venue.name);
    setShowSuggestions(false);
    navigate(`/venue/${venue._id}`);
    setIsMenuOpen(false);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-sm py-3' 
          : 'bg-gradient-to-r from-purple-900/70 via-pink-800/70 to-pink-600/70 backdrop-blur-sm py-5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="relative z-10 group"
          >
            <span className={`text-2xl font-bold transition-all duration-300 group-hover:scale-105 inline-block ${
              scrolled 
                ? 'bg-gradient-to-r from-pink-600 to-purple-700 bg-clip-text text-transparent' 
                : 'text-white drop-shadow-md'
            }`}>
              Find<span className={scrolled ? 'text-pink-500' : 'text-pink-300'}>My</span>Venue
            </span>
          </Link>

          {/* Centered Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 mx-8 max-w-md relative">
            <div className={`relative rounded-full overflow-hidden transition-all duration-300 ${
              scrolled 
                ? 'bg-gray-100 hover:bg-gray-200 shadow-sm' 
                : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm shadow-lg'
            }`}>
              <input
                type="text"
                placeholder="Search venues..."
                className={`w-full pl-10 pr-4 py-2 text-sm outline-none transition-colors duration-300 border border-pink-200 focus:border-pink-500 rounded-full ${
                  scrolled 
                    ? 'bg-transparent text-gray-800 placeholder-gray-500 focus:ring-1 focus:ring-pink-300' 
                    : 'bg-transparent text-white placeholder-white/80 focus:ring-1 focus:ring-white/50'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Search className={`absolute left-3 top-2.5 h-4 w-4 ${scrolled ? 'text-gray-500' : 'text-white/80'}`} />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className={`absolute left-0 w-full mt-2 rounded-xl shadow-lg z-50 max-h-[300px] overflow-y-auto ${
                scrolled 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-white/95 backdrop-blur-sm border border-white/20'
              }`}>
                {suggestions.length > 0 ? (
                  suggestions.map((venue, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-pink-50 cursor-pointer transition-colors duration-200 flex items-start group"
                      onClick={() => handleSuggestionClick(venue)}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200 mr-3">
                        <img
                          src={venueImages[venue.name] || venue.imageUrl}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-sm font-medium text-gray-800 group-hover:text-pink-600 transition-colors duration-200">{venue.name}</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1 text-pink-500 flex-shrink-0" />
                          <span className="truncate">{formatLocation(venue)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500 text-sm">No venues found</div>
                )}
              </div>
            )}
          </form>

          {/* Right Side Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  scrolled 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white hover:opacity-90 shadow-sm' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm shadow-md'
                }`}
              >
                My Bookings
              </Link>
            )}
            {isAuthenticated ? (
              <Link 
                to="/profile" 
                className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  scrolled 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white hover:opacity-90 shadow-sm' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm shadow-md'
                }`}
              >
                Account
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                    scrolled 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-sm' 
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm shadow-md'
                  }`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                    scrolled 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-sm' 
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm shadow-md'
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className={`md:hidden p-2 rounded-full transition-colors duration-300 ${
              scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10 backdrop-blur-sm'
            }`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isMenuOpen ? 'max-h-[450px] shadow-lg' : 'max-h-0'
        } ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-sm' 
            : 'bg-gradient-to-r from-purple-900/90 via-pink-800/90 to-pink-600/90 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto px-4 py-5 space-y-5">
          <form onSubmit={handleSearch} className="relative">
            <div className={`rounded-full overflow-hidden transition-all duration-300 ${
              scrolled 
                ? 'bg-gray-100' 
                : 'bg-white/10 backdrop-blur-sm'
            }`}>
              <input
                type="text"
                placeholder="Search venues..."
                className={`w-full pl-10 pr-4 py-3 outline-none transition-colors duration-300 ${
                  scrolled 
                    ? 'bg-transparent text-gray-800 placeholder-gray-500' 
                    : 'bg-transparent text-white placeholder-white/70'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Search className={`absolute left-3 top-3.5 h-5 w-5 ${scrolled ? 'text-gray-500' : 'text-white/80'}`} />
              <button 
                type="submit" 
                className={`absolute right-2 top-[55%] transform -translate-y-1/2 px-3 py-1.5 text-sm font-medium rounded-full ${
                  scrolled 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white' 
                    : 'bg-white/20 text-white backdrop-blur-sm'
                }`}
              >
                Search
              </button>
            </div>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && (
              <div className={`absolute left-0 w-full mt-2 rounded-xl shadow-lg z-50 max-h-[300px] overflow-y-auto ${
                scrolled 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-white/95 backdrop-blur-sm border border-white/20'
              }`}>
                {suggestions.length > 0 ? (
                  suggestions.map((venue, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-pink-50 cursor-pointer transition-colors duration-200 flex items-start group"
                      onClick={() => handleSuggestionClick(venue)}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200 mr-3">
                        <img
                          src={venueImages[venue.name] || venue.imageUrl}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-sm font-medium text-gray-800 group-hover:text-pink-600 transition-colors duration-200">{venue.name}</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1 text-pink-500 flex-shrink-0" />
                          <span className="truncate">{formatLocation(venue)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-500 text-sm">No venues found</div>
                )}
              </div>
            )}
          </form>
          
          <nav className="space-y-4">
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className={`block py-2 font-medium ${
                  scrolled ? 'text-gray-800 hover:text-pink-600' : 'text-white hover:text-pink-200'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Bookings
              </Link>
            )}
            {isAuthenticated && (
              <Link 
                to="/profile" 
                className={`block py-2 font-medium ${
                  scrolled ? 'text-gray-800 hover:text-pink-600' : 'text-white hover:text-pink-200'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Account
              </Link>
            )}
          </nav>
          
          {!isAuthenticated && (
            <div className="pt-3 space-y-3">
              <Link 
                to="/login" 
                className={`block w-full py-2.5 text-center rounded-full font-medium transition-all duration-300 ${
                  scrolled 
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={`block w-full py-2.5 text-center rounded-full font-medium transition-all duration-300 ${
                  scrolled 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white hover:opacity-90' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
