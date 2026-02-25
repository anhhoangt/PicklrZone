import React, { useState, useRef, useEffect, useCallback } from "react";
import "./LocationAutocomplete.css";

const US_LOCATIONS = [
  "Albuquerque, NM", "Anaheim, CA", "Anchorage, AK", "Arlington, TX", "Arlington, VA",
  "Atlanta, GA", "Augusta, GA", "Aurora, CO", "Aurora, IL", "Austin, TX",
  "Bakersfield, CA", "Baltimore, MD", "Baton Rouge, LA", "Bellevue, WA", "Birmingham, AL",
  "Boca Raton, FL", "Boise, ID", "Boston, MA", "Boulder, CO", "Bridgeport, CT",
  "Buffalo, NY", "Burbank, CA", "Cambridge, MA", "Cape Coral, FL", "Carlsbad, CA",
  "Carmel, IN", "Cary, NC", "Chandler, AZ", "Charleston, SC", "Charlotte, NC",
  "Chattanooga, TN", "Chesapeake, VA", "Chicago, IL", "Chula Vista, CA", "Cincinnati, OH",
  "Clearwater, FL", "Cleveland, OH", "Colorado Springs, CO", "Columbia, SC", "Columbus, OH",
  "Coral Springs, FL", "Corona, CA", "Corpus Christi, TX", "Costa Mesa, CA", "Dallas, TX",
  "Dayton, OH", "Denton, TX", "Denver, CO", "Des Moines, IA", "Detroit, MI",
  "Durham, NC", "Edison, NJ", "El Monte, CA", "El Paso, TX", "Elk Grove, CA",
  "Erie, PA", "Escondido, CA", "Eugene, OR", "Evansville, IN", "Everett, WA",
  "Fort Collins, CO", "Fort Lauderdale, FL", "Fort Wayne, IN", "Fort Worth, TX",
  "Fremont, CA", "Fresno, CA", "Frisco, TX", "Fullerton, CA", "Gainesville, FL",
  "Garden Grove, CA", "Garland, TX", "Gilbert, AZ", "Glendale, AZ", "Glendale, CA",
  "Grand Prairie, TX", "Grand Rapids, MI", "Greensboro, NC", "Gresham, OR",
  "Hampton, VA", "Hartford, CT", "Henderson, NV", "Hialeah, FL", "Hollywood, FL",
  "Honolulu, HI", "Houston, TX", "Huntington Beach, CA", "Huntsville, AL",
  "Independence, MO", "Indianapolis, IN", "Irvine, CA", "Irving, TX", "Jackson, MS",
  "Jacksonville, FL", "Jersey City, NJ", "Kansas City, KS", "Kansas City, MO",
  "Killeen, TX", "Knoxville, TN", "Lakewood, CO", "Lancaster, CA", "Laredo, TX",
  "Las Vegas, NV", "Lewisville, TX", "Lexington, KY", "Lincoln, NE",
  "Little Rock, AR", "Long Beach, CA", "Los Angeles, CA", "Louisville, KY",
  "Lubbock, TX", "Madison, WI", "Manchester, NH", "McAllen, TX", "McKinney, TX",
  "Memphis, TN", "Mesa, AZ", "Mesquite, TX", "Miami, FL", "Miami Gardens, FL",
  "Milwaukee, WI", "Minneapolis, MN", "Miramar, FL", "Mobile, AL", "Modesto, CA",
  "Montgomery, AL", "Moreno Valley, CA", "Murfreesboro, TN", "Murrieta, CA",
  "Naperville, IL", "Naples, FL", "Nashville, TN", "New Haven, CT", "New Orleans, LA",
  "New York, NY", "Newark, NJ", "Newport Beach, CA", "Norfolk, VA",
  "Norman, OK", "North Las Vegas, NV", "Norwalk, CA", "Oakland, CA",
  "Oceanside, CA", "Oklahoma City, OK", "Olathe, KS", "Omaha, NE", "Ontario, CA",
  "Orange, CA", "Orlando, FL", "Overland Park, KS", "Oxnard, CA",
  "Palm Bay, FL", "Palm Springs, CA", "Palmdale, CA", "Paradise, NV",
  "Pasadena, CA", "Pasadena, TX", "Paterson, NJ", "Peoria, AZ", "Peoria, IL",
  "Philadelphia, PA", "Phoenix, AZ", "Pittsburgh, PA", "Plano, TX",
  "Pompano Beach, FL", "Port St. Lucie, FL", "Portland, OR", "Providence, RI",
  "Provo, UT", "Pueblo, CO", "Raleigh, NC", "Rancho Cucamonga, CA", "Reno, NV",
  "Richmond, VA", "Riverside, CA", "Rochester, MN", "Rochester, NY", "Rockford, IL",
  "Roseville, CA", "Round Rock, TX", "Sacramento, CA", "Salem, OR",
  "Salt Lake City, UT", "San Antonio, TX", "San Bernardino, CA", "San Clemente, CA",
  "San Diego, CA", "San Francisco, CA", "San Jose, CA", "San Marcos, TX",
  "San Mateo, CA", "Santa Ana, CA", "Santa Clara, CA", "Santa Clarita, CA",
  "Santa Cruz, CA", "Santa Maria, CA", "Santa Monica, CA", "Santa Rosa, CA",
  "Savannah, GA", "Scottsdale, AZ", "Seattle, WA", "Shreveport, LA",
  "Simi Valley, CA", "Sioux Falls, SD", "South Bend, IN", "Spokane, WA",
  "Springfield, IL", "Springfield, MO", "Springfield, MA", "St. Louis, MO",
  "St. Paul, MN", "St. Petersburg, FL", "Stamford, CT", "Sterling Heights, MI",
  "Stockton, CA", "Sugar Land, TX", "Sunnyvale, CA", "Surprise, AZ",
  "Syracuse, NY", "Tacoma, WA", "Tallahassee, FL", "Tampa, FL", "Temecula, CA",
  "Tempe, AZ", "Thousand Oaks, CA", "Toledo, OH", "Topeka, KS", "Torrance, CA",
  "Tucson, AZ", "Tulsa, OK", "Tuscaloosa, AL", "Tyler, TX",
  "Vallejo, CA", "Vancouver, WA", "Ventura, CA", "Virginia Beach, VA",
  "Visalia, CA", "Waco, TX", "Warren, MI", "Washington, DC", "Waterbury, CT",
  "West Covina, CA", "West Jordan, UT", "West Palm Beach, FL", "Westminster, CO",
  "Wichita, KS", "Wilmington, NC", "Winston-Salem, NC", "Woodbridge, NJ",
  "Worcester, MA", "Yonkers, NY",
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "e.g., Austin, TX",
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filterLocations = useCallback((query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = US_LOCATIONS.filter((loc) => loc.toLowerCase().includes(q));
    // Sort: starts-with matches first, then contains matches
    matches.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.localeCompare(b);
    });
    return matches.slice(0, 8);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    const filtered = filterLocations(val);
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
    setActiveIndex(-1);
  };

  const handleSelect = (loc: string) => {
    onChange(loc);
    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Scroll the active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (value.trim()) {
      const filtered = filterLocations(value);
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    }
  };

  // Highlight matching text in suggestion
  const highlightMatch = (text: string) => {
    if (!value.trim()) return text;
    const idx = text.toLowerCase().indexOf(value.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="loc-highlight">{text.slice(idx, idx + value.length)}</strong>
        {text.slice(idx + value.length)}
      </>
    );
  };

  return (
    <div className="loc-autocomplete" ref={wrapperRef}>
      <div className="loc-input-wrapper">
        <span className="loc-input-icon">📍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="loc-dropdown" ref={listRef} role="listbox">
          {suggestions.map((loc, idx) => (
            <li
              key={loc}
              className={`loc-option ${idx === activeIndex ? "loc-option-active" : ""}`}
              onClick={() => handleSelect(loc)}
              onMouseEnter={() => setActiveIndex(idx)}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <span className="loc-option-icon">📍</span>
              <span className="loc-option-text">{highlightMatch(loc)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;
