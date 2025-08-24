"use client";

import { useState, useEffect } from "react";

interface LanguageSelectorProps {
  businessId: string;
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  maxLanguages?: number;
  disabled?: boolean;
  className?: string;
}

// OpenRouter supported languages for feedback generation
const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "gu", name: "Gujarati" },
  { code: "raj", name: "Rajasthani" },
  { code: "mr", name: "Marathi" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ar", name: "Arabic" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
];

export default function LanguageSelector({
  businessId,
  selectedLanguages,
  onLanguagesChange,
  maxLanguages = 3,
  disabled = false,
  className = "",
}: LanguageSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLanguageToggle = (languageCode: string) => {
    if (disabled) return;

    if (selectedLanguages.includes(languageCode)) {
      // Remove language
      onLanguagesChange(selectedLanguages.filter(code => code !== languageCode));
    } else if (selectedLanguages.length < maxLanguages) {
      // Add language
      onLanguagesChange([...selectedLanguages, languageCode]);
    }
  };

  const saveLanguagePreferences = async () => {
    if (selectedLanguages.length === 0) return;

    setSaving(true);
    try {
      const languages = selectedLanguages.map(code => {
        const lang = supportedLanguages.find(l => l.code === code);
        return {
          code,
          name: lang?.name || code,
        };
      });

      const response = await fetch(`/api/businesses/${businessId}/languages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ languages }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save language preferences");
      }

      // Language preferences saved successfully
      alert("Language preferences saved successfully! These cannot be changed later.");
      
      // Trigger custom event to notify other components about language changes
      window.dispatchEvent(new CustomEvent('languagePreferencesUpdated', {
        detail: { businessId, languages: selectedLanguages }
      }));
    } catch (error) {
      console.error("Error saving language preferences:", error);
      alert(error instanceof Error ? error.message : "Failed to save language preferences");
    } finally {
      setSaving(false);
    }
  };

  const getLanguageName = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code)?.name || code;
  };

  const availableLanguages = supportedLanguages.filter(
    lang => !selectedLanguages.includes(lang.code)
  );

  return (
    <div className={`relative ${className}`}>
      {/* Selected Languages */}
      {selectedLanguages.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map((code) => (
              <span
                key={code}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
              >
                {getLanguageName(code)}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleLanguageToggle(code)}
                    className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                    aria-label={`Remove ${getLanguageName(code)}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Language Selection Dropdown */}
      {!disabled && selectedLanguages.length < maxLanguages && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-gray-700">
              {selectedLanguages.length === 0
                ? "Select languages for feedback generation..."
                : `Add another language (${selectedLanguages.length}/${maxLanguages})`}
            </span>
            <svg
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => {
                    handleLanguageToggle(language.code);
                    if (selectedLanguages.length + 1 >= maxLanguages) {
                      setIsDropdownOpen(false);
                    }
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-gray-900">{language.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({language.code})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {!disabled && selectedLanguages.length > 0 && (
        <div className="mt-4">
          <button
            onClick={saveLanguagePreferences}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Language Preferences"
            )}
          </button>
          <p className="text-xs text-gray-600 mt-2">
            <strong>Note:</strong> Once saved, language preferences cannot be changed.
          </p>
        </div>
      )}

      {/* Disabled State Message */}
      {disabled && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Language preferences are locked and cannot be changed.
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="mt-2 text-xs text-gray-600">
        Select up to {maxLanguages} languages for generating multilingual feedback.
        {selectedLanguages.length > 0 && ` Selected: ${selectedLanguages.length}/${maxLanguages}`}
      </p>
    </div>
  );
}