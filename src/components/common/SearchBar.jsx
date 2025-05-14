import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllVenues } from '../../services/api';

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

const POPULAR_AREAS = [
  'Jubilee Hills',
  'Banjara Hills',
  'Gachibowli',
  'Madhapur',
  'Ameerpet',
];

const SearchBar = () => {
  const [input, setInput] = useState('');
  const [venues, setVenues] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchAllVenues()
      .then(data => setVenues(data))
      .catch(() => setError('Failed to load venues'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const val = input.trim().toLowerCase();
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
      ...venueMatches.map(v => ({ type: 'venue', value: v.name, address: v.address, id: v._id })),
    ].slice(0, 5);
    setSuggestions(combined);
    setShowDropdown(true);
  }, [input, venues]);

  const handleInput = e => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = suggestion => {
    setShowDropdown(false);
    if (suggestion.type === 'area') {
      setInput(suggestion.value);
      navigate(`/venues?search=${encodeURIComponent(suggestion.value)}`);
    } else if (suggestion.type === 'venue') {
      navigate(`/venue/${suggestion.id}`);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (input.trim()) {
      navigate(`/venues?search=${encodeURIComponent(input.trim())}`);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
          placeholder="Search by area"
          value={input}
          onChange={handleInput}
          onFocus={() => input && setShowDropdown(true)}
          onBlur={handleBlur}
        />
      </form>
      {showDropdown && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-500 text-center">Loading...</div>
          ) : error ? (
            <div className="p-4 text-red-500 text-center">{error}</div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-gray-600 text-center">
              No results found.<br />
              <span className="text-xs text-gray-400">Tip: Try popular areas like {POPULAR_AREAS.join(', ')}</span>
            </div>
          ) : (
            suggestions.map((s, idx) =>
              s.type === 'area' ? (
                <div
                  key={s.value + idx}
                  className="px-4 py-2 cursor-pointer hover:bg-pink-50 text-pink-700 font-semibold"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  {s.value}
                  <span className="ml-2 text-xs text-gray-400">(Area)</span>
                </div>
              ) : (
                <div
                  key={s.id}
                  className="px-4 py-2 cursor-pointer hover:bg-pink-50"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <div className="font-medium text-gray-800">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.address}</div>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;