import React, { useState, useEffect, useMemo } from 'react';
import type { SearchBarProps, ParkingLocation } from '../../types';
import styles from './SearchBar.module.css';

const SearchBar: React.FC<SearchBarProps> = ({
  parkingData,
  onSearchResults,
  onClearSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Filter parking locations based on search term
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    return parkingData.filter((location) => {
      const nameMatch = location.name.toLowerCase().includes(term);
      const addressMatch = location.address.toLowerCase().includes(term);
      const typeMatch = location.type.toLowerCase().includes(term);
      
      return nameMatch || addressMatch || typeMatch;
    });
  }, [parkingData, searchTerm]);

  // Generate search suggestions (first 5 results)
  const suggestions = useMemo(() => {
    return filteredResults.slice(0, 5);
  }, [filteredResults]);

  // Update search results when filtered results change
  useEffect(() => {
    onSearchResults(filteredResults);
  }, [filteredResults, onSearchResults]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  const handleSuggestionClick = (location: ParkingLocation) => {
    setSearchTerm(location.name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Filter to show only the selected location
    onSearchResults([location]);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    onClearSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className={styles.highlight}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search parking locations..."
          className={styles.searchInput}
          aria-label="Search parking locations"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          role="combobox"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className={styles.clearButton}
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul 
          className={styles.suggestionsList}
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((location, index) => (
            <li
              key={location.id}
              onClick={() => handleSuggestionClick(location)}
              className={`${styles.suggestionItem} ${
                index === selectedSuggestionIndex ? styles.selected : ''
              }`}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
            >
              <div className={styles.suggestionName}>
                {highlightSearchTerm(location.name, searchTerm)}
              </div>
              <div className={styles.suggestionAddress}>
                {highlightSearchTerm(location.address, searchTerm)}
              </div>
              <div className={styles.suggestionCapacity}>
                {location.capacity.available}/{location.capacity.total} available
              </div>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && searchTerm.trim() && suggestions.length === 0 && (
        <div className={styles.noResults}>
          No parking locations found for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;