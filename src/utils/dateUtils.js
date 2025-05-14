/**
 * Date utility functions for the venue booking system
 */

// Minimum bookable date - May 8, 2025
const MIN_BOOKABLE_DATE = new Date('2025-05-08T00:00:00.000Z');

/**
 * Sets a date to the start of day (midnight)
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} Date set to start of day
 */
export const setToStartOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Sets a date to the end of day (23:59:59.999)
 * @param {Date|string} date - Date object or ISO string
 * @returns {Date} Date set to end of day
 */
export const setToEndOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Checks if two dates are the same day (ignoring time)
 * @param {Date|string} date1 - First date to compare
 * @param {Date|string} date2 - Second date to compare
 * @returns {boolean} True if dates are the same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Checks if a given date is a Monday
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is a Monday
 */
export const isMonday = (date) => {
  return new Date(date).getDay() === 1; // 0 is Sunday, 1 is Monday
};

/**
 * Checks if a date is valid for booking (not a Monday, not before minimum date)
 * @param {Date|string} date - Date to check
 * @returns {Object} Object with valid flag and reason if invalid
 */
export const isValidBookingDate = (date) => {
  const checkDate = new Date(date);
  
  // Check if it's before the minimum bookable date
  if (setToStartOfDay(checkDate) < MIN_BOOKABLE_DATE) {
    return {
      valid: false,
      reason: "Bookings are only available from May 8, 2025 onwards"
    };
  }
  
  // Check if it's a Monday
  if (isMonday(checkDate)) {
    return {
      valid: false,
      reason: "Venue is closed on Mondays"
    };
  }
  
  return { valid: true };
};

/**
 * Validates a reschedule date (must be available, not past, within constraints)
 * @param {Date|string} originalDate - The original booking date
 * @param {Date|string} newDate - The requested reschedule date
 * @returns {Object} Object with valid flag and reason if invalid
 */
export const validateRescheduleDate = (originalDate, newDate) => {
  // First check if it's a valid booking date
  const basicValidation = isValidBookingDate(newDate);
  if (!basicValidation.valid) {
    return basicValidation;
  }
  
  // Check if it's today, tomorrow or within allowed range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const requestDate = setToStartOfDay(new Date(newDate));
  
  // Is it the same as original date?
  if (isSameDay(originalDate, newDate)) {
    return {
      valid: false,
      reason: "New date cannot be the same as the original booking date"
    };
  }
  
  // Is it a past date?
  if (requestDate < today) {
    return {
      valid: false,
      reason: "Cannot reschedule to a past date"
    };
  }
  
  return { valid: true };
};

/**
 * Checks if a specific date is already booked for a venue
 * @param {Array} bookings - Array of booking objects with startDate and endDate
 * @param {Date|string} date - Date to check
 * @param {string} [currentBookingId] - Optional ID of current booking to exclude
 * @returns {boolean} True if the date is already booked
 */
export const isDateBooked = (bookings, date, currentBookingId = null) => {
  const requestDate = setToStartOfDay(new Date(date));
  
  return bookings.some(booking => {
    // Skip current booking when checking
    if (currentBookingId && booking.id === currentBookingId) {
      return false;
    }
    
    const bookingStart = setToStartOfDay(new Date(booking.startDate));
    const bookingEnd = setToStartOfDay(new Date(booking.endDate));
    
    return (
      requestDate >= bookingStart && requestDate <= bookingEnd
    );
  });
};

/**
 * Gets available dates for a venue within a date range
 * @param {Array} bookings - Array of booking objects with startDate and endDate
 * @param {Date|string} startDate - Start of range to check
 * @param {Date|string} endDate - End of range to check
 * @returns {Array} Array of available date objects
 */
export const getAvailableDates = (bookings, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const availableDates = [];
  
  // Iterate through each day in the range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    
    // Skip if it's not a valid booking date
    const { valid, reason } = isValidBookingDate(currentDate);
    if (!valid) {
      continue;
    }
    
    // Skip if it's already booked
    if (isDateBooked(bookings, currentDate)) {
      continue;
    }
    
    availableDates.push({
      date: new Date(currentDate),
      dateString: currentDate.toISOString().split('T')[0] // YYYY-MM-DD format
    });
  }
  
  return availableDates;
};

/**
 * Formats a date object to ISO string (YYYY-MM-DD) without time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateToISO = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Formats a date for display (e.g., "Monday, January 1, 2025")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 