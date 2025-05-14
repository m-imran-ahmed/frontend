import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Users, Filter, X, Calendar } from 'lucide-react';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import { fetchAllVenues } from '../services/api';
import { venueImages } from '../assets/images';
import { motion } from 'framer-motion';

// Define filter options
const priceRanges = [
  { value: '10000-25000', label: '₹10,000 - ₹25,000' },
  { value: '25000-50000', label: '₹25,000 - ₹50,000' },
  { value: '50000-100000', label: '₹50,000 - ₹100,000' },
  { value: '100000', label: '₹100,000+' }
];

const capacityRanges = [
  { value: '50-100', label: '50-100 guests' },
  { value: '100-200', label: '100-200 guests' },
  { value: '200-300', label: '200-300 guests' },
  { value: '300', label: '300+ guests' }
];

const venueTypes = [
  { value: 'Banquet Hall', label: 'Banquet Hall' },
  { value: 'Conference Hall', label: 'Conference Hall' },
  { value: 'Function Hall', label: 'Function Hall' },
  { value: 'Outdoor Venue', label: 'Outdoor Venue' },
  { value: 'Rooftop Venue', label: 'Rooftop Venue' },
  { value: 'Garden Venue', label: 'Garden Venue' },
  { value: 'Beach Venue', label: 'Beach Venue' },
  { value: 'Resort Venue', label: 'Resort Venue' }
];

const VenueListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: searchParams.get('search') || '',
    priceRange: '',
    capacity: '',
    venueType: ''
  });

  // Area suggestions for Hyderabad
  const HYDERABAD_AREAS = [
    'Jubilee Hills',
    'Banjara Hills',
    'Gachibowli',
    'Ameerpet',
    'Madhapur',
    'Begumpet',
    'Hi-Tech City',
    'Financial District',
    'Ameerpet X Roads',
    'Begumpet Airport Road',
    'Road No. 12',
    'Gachibowli Main Road',
  ];
  const [locationInput, setLocationInput] = useState(filters.location || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!locationInput.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const val = locationInput.trim().toLowerCase();
    // Area suggestions
    const areaMatches = HYDERABAD_AREAS.filter(area =>
      area.toLowerCase().includes(val)
    );
    // Venue suggestions (up to 3)
    const venueMatches = venues.filter(v =>
      v.address && v.address.toLowerCase().includes(val)
    ).slice(0, 3);
    // Combine, limit to 5
    const combined = [
      ...areaMatches.map(area => ({ type: 'area', value: area })),
      ...venueMatches.map(v => ({ type: 'venue', value: v.name, address: v.address })),
    ].slice(0, 5);
    setSuggestions(combined);
    setShowDropdown(true);
  }, [locationInput, venues]);

  useEffect(() => {
    const loadVenues = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchAllVenues();
        setVenues(data);
        setFilteredVenues(data);
      } catch (error) {
        console.error('Error loading venues:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadVenues();
  }, []);

  // Update filtered venues live as user types in locationInput
  useEffect(() => {
    const filtered = venues.filter(venue => {
      // Location filter (live)
      if (locationInput) {
        const venueArea = formatLocation(venue);
        const locationMatch = venueArea.toLowerCase().includes(locationInput.toLowerCase());
        if (!locationMatch) return false;
      }
      
      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max && (venue.dailyRate < min || venue.dailyRate > max)) {
          return false;
        }
        if (!max && venue.dailyRate < min) {
          return false;
        }
      }
      // Capacity filter
      if (filters.capacity) {
        const [min, max] = filters.capacity.split('-').map(Number);
        if (max && (venue.capacity < min || venue.capacity > max)) {
          return false;
        }
        if (!max && venue.capacity < min) {
          return false;
        }
      }
      // Venue type filter
      if (filters.venueType && venue.type?.toLowerCase() !== filters.venueType.toLowerCase()) {
        return false;
      }
      return true;
    });
    setFilteredVenues(filtered);
  }, [locationInput, venues, filters.priceRange, filters.capacity, filters.venueType]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // If location filter is being changed, also update locationInput
    if (name === 'location') {
      setLocationInput(value);
    }
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    // Reset all filters
    setFilters({
      location: '',
      priceRange: '',
      capacity: '',
      venueType: ''
    });
    
    // Also reset location input
    setLocationInput('');
    
    // Reset filtered venues to show all venues
    setFilteredVenues(venues);
  };

  const applyFilters = () => {
    const filtered = venues.filter(venue => {
      // Location filter
      if (filters.location && venue.address) {
        const locationMatch = venue.address.toLowerCase().includes(filters.location.toLowerCase());
        if (!locationMatch) return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max && (venue.dailyRate < min || venue.dailyRate > max)) {
          return false;
        }
        if (!max && venue.dailyRate < min) {
          return false;
        }
      }

      // Capacity filter
      if (filters.capacity) {
        const [min, max] = filters.capacity.split('-').map(Number);
        if (max && (venue.capacity < min || venue.capacity > max)) {
          return false;
        }
        if (!max && venue.capacity < min) {
          return false;
        }
      }

      // Venue type filter
      if (filters.venueType && venue.type?.toLowerCase() !== filters.venueType.toLowerCase()) {
        return false;
      }

      return true;
    });

    setFilteredVenues(filtered);
    setShowFilters(false);
  };

  const removeFilter = (key) => {
    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);
    
    // Reapply remaining filters
    const filtered = venues.filter(venue => {
      // Location filter
      if (newFilters.location && venue.address) {
        const locationMatch = venue.address.toLowerCase().includes(newFilters.location.toLowerCase());
        if (!locationMatch) return false;
      }
      
      if (newFilters.priceRange) {
        const [min, max] = newFilters.priceRange.split('-').map(Number);
        if (max && (venue.dailyRate < min || venue.dailyRate > max)) {
          return false;
        }
        if (!max && venue.dailyRate < min) {
          return false;
        }
      }
      if (newFilters.capacity) {
        const [min, max] = newFilters.capacity.split('-').map(Number);
        if (max && (venue.capacity < min || venue.capacity > max)) {
          return false;
        }
        if (!max && venue.capacity < min) {
          return false;
        }
      }
      if (newFilters.venueType && venue.type?.toLowerCase() !== newFilters.venueType.toLowerCase()) {
        return false;
      }
      return true;
    });

    setFilteredVenues(filtered);
  };

  const handleVenueClick = (venueId) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/venue/${venueId}`);
  };

  const handleLocationInput = (e) => {
    setLocationInput(e.target.value);
    setFilters(prev => ({ ...prev, location: e.target.value }));
  };

  const handleSuggestionClick = (suggestion) => {
    setLocationInput(suggestion.type === 'area' ? suggestion.value : suggestion.address);
    setFilters(prev => ({ ...prev, location: suggestion.type === 'area' ? suggestion.value : suggestion.address }));
    setShowDropdown(false);
    applyFilters();
  };

  const handleLocationFocus = () => {
    if (locationInput.trim()) setShowDropdown(true);
  };

  const handleLocationBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleAllVenues = () => {
    // Reset all filters
    setFilters({
      location: '',
      priceRange: '',
      capacity: '',
      venueType: ''
    });
    
    // Reset location input
    setLocationInput('');
    
    // Reset filtered venues to show all venues
    setFilteredVenues(venues);
    
    // Close filters panel if open
    setShowFilters(false);
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
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Filter Button */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Buttons row */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => navigate('/')}
              className="px-3 py-1.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-md"
              type="button"
            >
              <Filter className="h-5 w-5" />
              <span>Browse by Filters</span>
            </button>
          </div>
          
          {/* Title row */}
          <h1 className="text-3xl font-bold text-gray-800">All Venues</h1>
        </div>

        {/* Modern Filter Panel */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-pink-500" />
                  Filter Venues
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  Reset All
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Enter location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range
                  </label>
                  <select
                    name="priceRange"
                    value={filters.priceRange}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="">All Price Ranges</option>
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Capacity
                  </label>
                  <select
                    name="capacity"
                    value={filters.capacity}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="">All Capacities</option>
                    {capacityRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Venue Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Type
                  </label>
                  <select
                    name="venueType"
                    value={filters.venueType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="">All Venue Types</option>
                    {venueTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  {filteredVenues.length} venues match your filters
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Filters */}
        {Object.values(filters).some(value => value) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              let label = value;
              let filterName = '';
              
              if (key === 'location') {
                filterName = 'Location:';
              } else if (key === 'priceRange') {
                filterName = 'Price:';
                label = priceRanges.find(range => range.value === value)?.label;
              } else if (key === 'capacity') {
                filterName = 'Capacity:';
                label = capacityRanges.find(range => range.value === value)?.label;
              } else if (key === 'venueType') {
                filterName = 'Type:';
                label = venueTypes.find(type => type.value === value)?.label;
              }
              
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-sm border border-pink-100"
                >
                  <span className="font-medium">{filterName}</span>
                  <span>{label}</span>
                  <button
                    onClick={() => removeFilter(key)}
                    className="ml-1 hover:text-pink-900"
                    aria-label={`Remove ${key} filter`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            
            {Object.values(filters).some(value => value) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredVenues.length} of {venues.length} venues
          </p>
        </div>

        {/* Venues Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-16 h-16 border-4 border-t-pink-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No venues found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredVenues.map((venue) => (
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

                {/* Image container with gradient overlay - updated with lighter gradient */}
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
                      <span className="text-2xl font-bold text-pink-600">₹{venue.dailyRate?.toLocaleString() || "10,000"}</span>
                      <span className="text-gray-500 text-sm ml-1">per day</span>
                    </div>
                  </div>
                </div>

                {/* Hover overlay for detailed pricing - only visible on hover - updated with lighter gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <div className="text-white text-center p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-xs uppercase tracking-wider bg-pink-600/80 px-2 py-1 rounded-full">Premium Venue</span>
                    <h4 className="text-2xl font-bold mt-4 mb-2">{venue.name}</h4>
                    <div className="space-y-2 max-w-xs mx-auto">
                      <p className="text-4xl font-bold text-white">₹{venue.dailyRate?.toLocaleString() || "10,000"}</p>
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
      </div>
      <Footer />
    </div>
  );
};

export default VenueListPage;