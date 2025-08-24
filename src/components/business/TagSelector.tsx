"use client";

import { useState, useRef, useEffect } from "react";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

const predefinedTags = [
  "restaurant", "food", "pizza", "burger", "coffee", "cafe", "bakery", "dessert",
  "delivery", "takeout", "dine-in", "fast-food", "fine-dining", "casual-dining",
  "italian", "chinese", "indian", "mexican", "japanese", "thai", "american",
  "vegetarian", "vegan", "halal", "kosher", "organic", "healthy",
  "shopping", "retail", "clothing", "fashion", "electronics", "books", "gifts",
  "beauty", "salon", "spa", "massage", "wellness", "fitness", "gym", "yoga",
  "healthcare", "medical", "dental", "pharmacy", "clinic", "hospital",
  "automotive", "repair", "service", "maintenance", "car-wash", "gas-station",
  "education", "school", "training", "tutoring", "language", "music", "art",
  "entertainment", "cinema", "theater", "gaming", "sports", "recreation",
  "hotel", "accommodation", "travel", "tourism", "vacation", "resort",
  "professional", "consulting", "legal", "accounting", "real-estate", "insurance",
  "technology", "software", "hardware", "repair", "support", "development",
  "home-services", "cleaning", "plumbing", "electrical", "construction", "renovation",
  "pet-services", "veterinary", "grooming", "boarding", "training", "supplies",
  "luxury", "premium", "budget", "affordable", "family-friendly", "kid-friendly",
  "24-hours", "open-late", "weekend", "appointment", "walk-in", "online", "mobile"
];

export default function TagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 10,
  placeholder = "Type to search and add tags...",
  className = ""
}: TagSelectorProps) {
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setFocusedSuggestionIndex(-1);

    if (value.length >= 2) {
      const filtered = predefinedTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !selectedTags.includes(tag)
      );
      setTagSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (
      trimmedTag &&
      !selectedTags.includes(trimmedTag) &&
      selectedTags.length < maxTags
    ) {
      onTagsChange([...selectedTags, trimmedTag]);
      setTagInput("");
      setShowSuggestions(false);
      setTagSuggestions([]);
      setFocusedSuggestionIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedSuggestionIndex >= 0 && tagSuggestions[focusedSuggestionIndex]) {
        addTag(tagSuggestions[focusedSuggestionIndex]);
      } else if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setTagSuggestions([]);
      setFocusedSuggestionIndex(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showSuggestions && tagSuggestions.length > 0) {
        setFocusedSuggestionIndex((prev) =>
          prev < tagSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showSuggestions && tagSuggestions.length > 0) {
        setFocusedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : tagSuggestions.length - 1
        );
      }
    } else if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                aria-label={`Remove ${tag} tag`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={tagInput}
          onChange={handleTagInputChange}
          onKeyDown={handleTagKeyPress}
          onFocus={() => {
            if (tagInput.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          placeholder={
            selectedTags.length >= maxTags
              ? `Maximum ${maxTags} tags reached`
              : placeholder
          }
          disabled={selectedTags.length >= maxTags}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Tag Counter */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
          {selectedTags.length}/{maxTags}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && tagSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {tagSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                index === focusedSuggestionIndex ? "bg-blue-50" : ""
              }`}
            >
              <span className="text-blue-600">#{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="mt-2 text-xs text-gray-600">
        Type to search from suggested tags or create your own. Press Enter to add, Backspace to remove the last tag.
      </p>
    </div>
  );
}