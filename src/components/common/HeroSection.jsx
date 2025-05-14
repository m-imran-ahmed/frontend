import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { venueImages } from '../../assets/images';
import { fetchAllVenues } from '../../services/api';

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [venues, setVenues] = useState([]);
  
  const phrases = ['Walima', 'Reception', 'Dinner', 'Party', 'Engagement', 'Meeting', 'Any Occasion'];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let timeout;

    if (!isDeleting && displayText === currentPhrase) {
      // If we've finished typing, wait and then start deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 3000); // Increased pause time to 3 seconds
    } else if (isDeleting && displayText === '') {
      // If we've finished deleting, move to next phrase
      setIsDeleting(false);
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    } else {
      // Continue typing or deleting
      timeout = setTimeout(() => {
        if (isDeleting) {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        } else {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }
      }, isDeleting ? 100 : 150); // Increased typing and deleting delays
    }

    return () => clearTimeout(timeout);
  }, [displayText, currentPhraseIndex, isDeleting, phrases]);
  
  // Fetch all venues for suggestions and filtering
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/venues?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
  
  const handleSuggestionClick = (venue) => {
    setSearchQuery(venue.name);
    setShowSuggestions(false);
    navigate(`/venue/${venue._id}`);
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

  const formatAddress = (venue) => {
    return formatLocation(venue);
  };

  return (
    <div className="relative min-h-[75vh] overflow-visible bg-gradient-to-r from-purple-900 via-pink-800 to-pink-600">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-purple-900/80 via-pink-800/80 to-pink-600/80"></div>
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-700 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-pink-600 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
            Find Your Perfect Venue for
          </h1>
          <div className="h-20 flex items-center justify-center mb-6">
            <span className="text-pink-300 text-4xl md:text-5xl lg:text-6xl font-bold transition-all duration-200 min-w-[200px] inline-block">
              {displayText}
            </span>
          </div>
          <p className="text-lg md:text-xl mb-6 text-white/90">
            Discover and book the ideal venue for your special day in Hyderabad
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative z-20">
            <div className="relative flex items-center justify-center">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search by area..."
                  className="w-full rounded-full pl-12 py-4 pr-24 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30 bg-white/10 backdrop-blur-lg text-white placeholder-white/70 border border-white/20"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button 
                    type="submit"
                    className="bg-white hover:bg-white/90 text-pink-600 px-6 py-2.5 rounded-full transition-all duration-300 font-medium shadow-lg hover:shadow-xl group"
                  >
                    <span className="flex items-center">
                      Search
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {showSuggestions && (
              <div className="absolute left-0 w-full mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-50 border border-white/20 max-h-[300px] overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((venue, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-white/50 cursor-pointer transition-colors duration-200 flex items-start group"
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
                        <h4 className="text-sm font-medium text-gray-800 group-hover:text-pink-600 transition-colors duration-200 text-left">{venue.name}</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1 text-pink-500 flex-shrink-0" />
                          <span className="truncate">{formatAddress(venue)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-700">
                    <div className="text-sm mb-2">
                      No matches found for "{searchQuery}"
                    </div>
                    <div className="text-xs text-gray-500">
                      Try searching for venues in your area
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="mt-8">
            <button 
              onClick={() => navigate('/venues')}
              className="px-6 py-3 bg-white text-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium group flex items-center mx-auto"
            >
              Explore All Venues
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="fill-gray-50 w-full">
          <path d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;
