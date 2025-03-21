/**
 * Binary Search implementation for the frontend
 * Used for searching through sorted lists of items
 */

/**
 * Performs binary search on a sorted array of objects
 * @param {Array} sortedArray - Sorted array of objects
 * @param {string|number} target - Target value to search for
 * @param {string} key - Object property to compare against (e.g., 'title')
 * @returns {number} Index of found item or -1 if not found
 */
export const binarySearch = (sortedArray, target, key) => {
  if (!sortedArray || sortedArray.length === 0 || !target) {
    return -1;
  }

  let left = 0;
  let right = sortedArray.length - 1;
  
  // Convert target to lowercase for case-insensitive search if it's a string
  const targetValue = typeof target === 'string' ? target.toLowerCase() : target;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = key ? sortedArray[mid][key] : sortedArray[mid];
    
    // Convert midValue to lowercase for case-insensitive search if it's a string
    const compareMidValue = typeof midValue === 'string' ? midValue.toLowerCase() : midValue;
    
    if (compareMidValue === targetValue) {
      return mid; // Found the target
    } else if (compareMidValue < targetValue) {
      left = mid + 1; // Target is in the right half
    } else {
      right = mid - 1; // Target is in the left half
    }
  }
  
  return -1; // Target not found
};

/**
 * Performs fuzzy binary search that can find partial matches
 * @param {Array} sortedArray - Sorted array of objects
 * @param {string} target - Target string to search for
 * @param {string} key - Object property to compare against (e.g., 'title')
 * @returns {Array} Array of objects that match the search
 */
export const fuzzySearch = (sortedArray, target, key) => {
  if (!sortedArray || sortedArray.length === 0 || !target) {
    return [];
  }
  
  const targetLower = target.toLowerCase();
  const results = [];
  
  // Linear search for fuzzy matching (this is more reliable for partial matching)
  for (let i = 0; i < sortedArray.length; i++) {
    const value = key ? sortedArray[i][key] : sortedArray[i];
    if (typeof value === 'string' && value.toLowerCase().includes(targetLower)) {
      results.push(sortedArray[i]);
    }
  }
  
  return results;
};

/**
 * Sort an array of objects by a key
 * @param {Array} array - Array of objects to sort
 * @param {string} key - The key to sort by
 * @param {boolean} ascending - Sort direction (default: true)
 * @returns {Array} Sorted array
 */
export const sortArrayByKey = (array, key, ascending = true) => {
  if (!array || array.length === 0 || !key) {
    return array;
  }
  
  return [...array].sort((a, b) => {
    // Handle dates
    if (a[key] instanceof Date && b[key] instanceof Date) {
      return ascending 
        ? a[key].getTime() - b[key].getTime() 
        : b[key].getTime() - a[key].getTime();
    }
    
    // Handle strings
    if (typeof a[key] === 'string' && typeof b[key] === 'string') {
      return ascending 
        ? a[key].localeCompare(b[key]) 
        : b[key].localeCompare(a[key]);
    }
    
    // Handle numbers and other types
    return ascending 
      ? a[key] - b[key] 
      : b[key] - a[key];
  });
};

/**
 * Search for items that match the search query in multiple fields
 * @param {Array} items - Array of objects to search through
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array} Items that match the search query
 */
export const searchItems = (items, query, fields) => {
  if (!items || items.length === 0 || !query || !fields || fields.length === 0) {
    return items;
  }
  
  const queryLower = query.toLowerCase();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(queryLower);
      }
      if (typeof value === 'number') {
        return value.toString().includes(queryLower);
      }
      return false;
    });
  });
}; 