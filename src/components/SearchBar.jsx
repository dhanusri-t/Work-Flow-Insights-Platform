import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function SearchBar({ 
  placeholder = "Search...", 
  onSearch,
  suggestions = [],
  onSelectSuggestion,
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
      setShowSuggestions(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={`
          relative flex items-center bg-gray-50 border rounded-xl overflow-hidden
          transition-all duration-200
          ${isFocused ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-200 hover:border-gray-300"}
        `}>
          <Search 
            size={18} 
            className={`ml-4 transition-colors ${isFocused ? "text-indigo-500" : "text-gray-400"}`} 
          />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="mr-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          
          <kbd className="hidden sm:inline-flex items-center gap-1 mr-3 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(suggestion);
                onSelectSuggestion?.(suggestion);
                setShowSuggestions(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Search size={14} className="text-gray-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
