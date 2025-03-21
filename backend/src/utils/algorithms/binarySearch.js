/**
 * Binary Search Algorithm for efficient searching
 * This will be used for searching functionality in the frontend
 */

/**
 * Performs binary search on a sorted array of objects
 * @param {Array} sortedArray - Sorted array of objects
 * @param {string|number} target - Target value to search for
 * @param {string} key - Object property to compare against (e.g., 'title')
 * @param {Function} compareFunc - Optional custom compare function
 * @returns {number} Index of found item or -1 if not found
 */
const binarySearch = (sortedArray, target, key, compareFunc = null) => {
  if (!sortedArray || sortedArray.length === 0) {
    return -1;
  }

  let left = 0;
  let right = sortedArray.length - 1;
  
  // Default compare function compares directly
  const defaultCompare = (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };
  
  // Use provided compare function or default
  const compare = compareFunc || defaultCompare;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = key ? sortedArray[mid][key] : sortedArray[mid];
    
    const comparison = compare(midValue, target);
    
    if (comparison === 0) {
      return mid; // Found the target
    } else if (comparison < 0) {
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
 * @returns {Array} Array of indices of matching items
 */
const fuzzyBinarySearch = (sortedArray, target, key) => {
  if (!sortedArray || sortedArray.length === 0) {
    return [];
  }
  
  const targetLower = target.toLowerCase();
  const results = [];
  
  // First find an exact match or the closest insertion point
  let left = 0;
  let right = sortedArray.length - 1;
  let mid = 0;
  
  while (left <= right) {
    mid = Math.floor((left + right) / 2);
    const midValue = (key ? sortedArray[mid][key] : sortedArray[mid]).toLowerCase();
    
    if (midValue.includes(targetLower)) {
      // Found a match, break to scan around this point
      break;
    }
    
    if (midValue < targetLower) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  // Check if we found a match
  const midValue = (key ? sortedArray[mid][key] : sortedArray[mid]).toLowerCase();
  if (midValue.includes(targetLower)) {
    results.push(mid);
    
    // Scan left
    let leftIdx = mid - 1;
    while (
      leftIdx >= 0 && 
      (key ? sortedArray[leftIdx][key] : sortedArray[leftIdx])
        .toLowerCase()
        .includes(targetLower)
    ) {
      results.push(leftIdx);
      leftIdx--;
    }
    
    // Scan right
    let rightIdx = mid + 1;
    while (
      rightIdx < sortedArray.length && 
      (key ? sortedArray[rightIdx][key] : sortedArray[rightIdx])
        .toLowerCase()
        .includes(targetLower)
    ) {
      results.push(rightIdx);
      rightIdx++;
    }
  }
  
  // Return sorted indices
  return results.sort((a, b) => a - b);
};

/**
 * Performs binary search to get the closest matches to a target
 * @param {Array} sortedArray - Sorted array of objects
 * @param {string|number} target - Target value to search for
 * @param {string} key - Object property to compare against (e.g., 'title')
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Array} Array of indices of closest matching items
 */
const getClosestMatches = (sortedArray, target, key, maxResults = 5) => {
  if (!sortedArray || sortedArray.length === 0) {
    return [];
  }
  
  // If array is smaller than maxResults, return all indices
  if (sortedArray.length <= maxResults) {
    return Array.from({ length: sortedArray.length }, (_, i) => i);
  }
  
  // First try to find the exact match
  const exactMatch = binarySearch(sortedArray, target, key);
  
  // If found, get items around it
  if (exactMatch !== -1) {
    const results = [exactMatch];
    let left = exactMatch - 1;
    let right = exactMatch + 1;
    
    // Add remaining results, alternating between left and right
    while (results.length < maxResults && (left >= 0 || right < sortedArray.length)) {
      if (left >= 0) {
        results.push(left);
        left--;
      }
      
      if (results.length < maxResults && right < sortedArray.length) {
        results.push(right);
        right++;
      }
    }
    
    return results.sort((a, b) => a - b);
  }
  
  // If not found, find the insertion point
  let left = 0;
  let right = sortedArray.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = key ? sortedArray[mid][key] : sortedArray[mid];
    
    if (midValue < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  // 'left' is now the insertion point
  const insertPoint = left;
  const results = [];
  
  // Get items around the insertion point
  let i = Math.max(0, insertPoint - Math.floor(maxResults / 2));
  const end = Math.min(sortedArray.length, i + maxResults);
  
  while (i < end) {
    results.push(i);
    i++;
  }
  
  return results;
};

module.exports = {
  binarySearch,
  fuzzyBinarySearch,
  getClosestMatches
}; 