import { useState, useEffect } from 'react';
import { TextField, InputAdornment, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchItems, sortArrayByKey } from '../../utils/search';

/**
 * Reusable search bar component with search suggestions
 * Uses binary search for efficient searching
 */
const SearchBar = ({ 
  data, 
  searchFields, 
  placeholder = 'Search...', 
  onSelect, 
  sortKey = null,
  minSearchLength = 2,
  maxResults = 5
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < minSearchLength) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Sort data if sortKey is provided
    const sortedData = sortKey ? sortArrayByKey(data, sortKey) : data;
    
    // Perform search
    const searchResults = searchItems(sortedData, query, searchFields);
    
    // Limit results
    const limitedResults = searchResults.slice(0, maxResults);
    
    setResults(limitedResults);
    setLoading(false);
  }, [query, data, searchFields, sortKey, minSearchLength, maxResults]);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(!!value && value.length >= minSearchLength);
  };

  const handleResultClick = (item) => {
    onSelect(item);
    setQuery('');
    setShowResults(false);
  };

  const handleBlur = () => {
    // Delayed hiding of results to allow for click on result
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={query}
        onChange={handleQueryChange}
        onFocus={() => setShowResults(!!query && query.length >= minSearchLength)}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={20} /> : <SearchIcon />}
            </InputAdornment>
          ),
        }}
      />

      {showResults && results.length > 0 && (
        <Paper 
          elevation={3} 
          style={{ 
            position: 'absolute', 
            width: '100%', 
            maxHeight: '300px', 
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '4px'
          }}
        >
          <List>
            {results.map((item, index) => (
              <ListItem 
                key={index} 
                button 
                onClick={() => handleResultClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <ListItemText 
                  primary={
                    searchFields.map(field => item[field]).filter(Boolean)[0] || 'Unknown'
                  } 
                  secondary={
                    searchFields.length > 1 
                      ? searchFields.slice(1).map(field => item[field]).filter(Boolean)[0] 
                      : null
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default SearchBar; 