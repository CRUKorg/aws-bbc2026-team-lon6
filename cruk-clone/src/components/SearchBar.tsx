import React, { useState, useRef, useEffect } from 'react';
import apiClient, { SearchResult } from '../services/api';
import './SearchBar.css';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "what are you looking for today",
  onSearch 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(true);

    try {
      const searchResults = await apiClient.search(searchQuery);
      setResults(searchResults);
      
      if (onSearch) {
        onSearch(searchQuery);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to search at this time. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    // In production, this would navigate to the article
    window.open(result.url, '_blank');
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <svg 
            className="search-icon" 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none"
          >
            <path 
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query && setShowResults(true)}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
            >
              ×
            </button>
          )}
        </div>
      </form>

      {showResults && (
        <div className="search-results">
          {loading && (
            <div className="search-loading">
              <div className="search-spinner"></div>
              <span>Searching...</span>
            </div>
          )}

          {error && (
            <div className="search-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && query && (
            <div className="search-no-results">
              <p>No results found for "{query}"</p>
              <p className="search-suggestion">Try different keywords or browse our topics</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="search-results-list">
              <div className="search-results-header">
                <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
              </div>
              {results.map((result) => (
                <div
                  key={result.articleId}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <h4 className="result-title">{result.title}</h4>
                  <p className="result-summary">{result.summary}</p>
                  <div className="result-meta">
                    <span className="result-category">{result.category}</span>
                    {result.tags && result.tags.length > 0 && (
                      <div className="result-tags">
                        {result.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="result-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
