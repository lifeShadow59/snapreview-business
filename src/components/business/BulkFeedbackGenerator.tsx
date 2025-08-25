"use client";

import { useState, useEffect, useCallback } from "react";

interface BulkFeedbackGeneratorProps {
  businessId: string;
  businessTags: string[];
  onFeedbackGenerated: (feedbacks: GeneratedFeedback[]) => void;
  onFeedbacksSaved?: () => void;
  onLanguagesChanged?: () => void;
  className?: string;
}

interface GeneratedFeedback {
  content: string;
  language_code: string;
}

interface LanguagePreference {
  id: number;
  business_id: string;
  language_code: string;
  language_name: string;
  created_at: string;
}

const quantityOptions = [
  { value: 1, label: "1 feedback" },
  { value: 10, label: "10 feedbacks" },
  { value: 20, label: "20 feedbacks" },
  { value: 50, label: "50 feedbacks" },
];

export default function BulkFeedbackGenerator({
  businessId,
  businessTags,
  onFeedbackGenerated,
  onFeedbacksSaved,
  onLanguagesChanged,
  className = "",
}: BulkFeedbackGeneratorProps) {
  const [availableLanguages, setAvailableLanguages] = useState<LanguagePreference[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFeedbacks, setGeneratedFeedbacks] = useState<GeneratedFeedback[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch available languages for this business
  const fetchLanguages = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/languages`);
      const data = await response.json();

      if (response.ok) {
        if (data.languages && data.languages.length > 0) {
          setAvailableLanguages(data.languages);
          setSelectedLanguage(data.languages[0].language_code);
        } else {
          // No language preferences set, default to English
          setAvailableLanguages([
            {
              id: 0,
              business_id: businessId,
              language_code: "en",
              language_name: "English",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      // Default to English on error
      setAvailableLanguages([
        {
          id: 0,
          business_id: businessId,
          language_code: "en",
          language_name: "English",
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [businessId]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  // Create a refresh function that can be called externally
  const refreshLanguages = useCallback(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  // Expose refresh function through callback - removed to prevent infinite loops
  // The parent can listen to the 'languagePreferencesUpdated' event instead

  // Listen for language changes and refresh
  useEffect(() => {
    const handleLanguageChange = () => {
      fetchLanguages();
    };

    // Listen for custom events or storage changes that might indicate language updates
    window.addEventListener('languagePreferencesUpdated', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languagePreferencesUpdated', handleLanguageChange);
    };
  }, [fetchLanguages]);

  const generateBulkFeedback = async () => {
    if (businessTags.length === 0) {
      setError("Please add some business tags first to generate relevant feedback.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccessMessage("");
    setGeneratedFeedbacks([]);

    try {
      const response = await fetch(`/api/businesses/${businessId}/generate-bulk-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language_code: selectedLanguage,
          quantity: selectedQuantity,
          tags: businessTags,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedFeedbacks(data.feedbacks);
        onFeedbackGenerated(data.feedbacks);
      } else {
        setError(data.error || "Failed to generate feedback");
      }
    } catch (error) {
      console.error("Error generating bulk feedback:", error);
      setError("An unexpected error occurred while generating feedback");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAllFeedbacks = async () => {
    if (generatedFeedbacks.length === 0) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/businesses/${businessId}/feedbacks/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbacks: generatedFeedbacks.map(feedback => ({
            content: feedback.content,
            language_code: feedback.language_code,
            rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        const message = `Successfully saved ${generatedFeedbacks.length} feedback${generatedFeedbacks.length > 1 ? 's' : ''} to your business!`;
        setSuccessMessage(message);
        
        // Clear generated feedbacks
        setGeneratedFeedbacks([]);
        
        // Call the refresh callback to update the feedback list
        if (onFeedbacksSaved) {
          onFeedbacksSaved();
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setError(data.error || "Failed to save feedbacks");
      }
    } catch (error) {
      console.error("Error saving feedbacks:", error);
      setError("An unexpected error occurred while saving feedbacks");
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguageName = (code: string) => {
    return availableLanguages.find(lang => lang.language_code === code)?.language_name || code;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Bulk Feedback Generator
        </h3>
        <p className="text-sm text-gray-600">
          Generate multiple AI-powered feedbacks in different languages based on your business tags.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Generation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isGenerating || isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.language_code} value={lang.language_code}>
                {lang.language_name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <select
            value={selectedQuantity}
            onChange={(e) => setSelectedQuantity(Number(e.target.value))}
            disabled={isGenerating || isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {quantityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Business Tags Display */}
      {businessTags.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Using Business Tags:
          </label>
          <div className="flex flex-wrap gap-2">
            {businessTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateBulkFeedback}
          disabled={isGenerating || isSaving || businessTags.length === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Generating {selectedQuantity} feedback{selectedQuantity > 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Generate {selectedQuantity} Feedback{selectedQuantity > 1 ? 's' : ''} in {getLanguageName(selectedLanguage)}
            </>
          )}
        </button>
      </div>

      {/* Generated Feedbacks Preview */}
      {generatedFeedbacks.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Generated Feedbacks ({generatedFeedbacks.length})
            </h4>
            <button
              onClick={saveAllFeedbacks}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              {isSaving ? (
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
                "Add All Feedbacks"
              )}
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {generatedFeedbacks.map((feedback, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    Feedback #{index + 1} • {getLanguageName(feedback.language_code)}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{feedback.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}