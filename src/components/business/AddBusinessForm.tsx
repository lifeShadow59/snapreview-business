"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BusinessType, CreateBusinessRequest } from "@/types/business";
import QRCode from "qrcode";

interface ContactInfo {
  phone_number: string;
  is_primary: boolean;
  label: string;
}

interface EmailInfo {
  email_address: string;
  is_primary: boolean;
  label: string;
}

export default function AddBusinessForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    business_type_id: 0,
    website: "",
    address: "",
    google_maps_url: "",
    description: "",
    tags: "", // Will be converted to array
  });

  // Step 2 - Review generation state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [addingFeedback, setAddingFeedback] = useState(false);
  const [updatingFeedback, setUpdatingFeedback] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState<number | null>(null);
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);

  // Step 3 - QR Code state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tag management state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [phoneNumbers, setPhoneNumbers] = useState<ContactInfo[]>([
    { phone_number: "", is_primary: true, label: "Primary" },
  ]);

  const [emailAddresses, setEmailAddresses] = useState<EmailInfo[]>([
    { email_address: "", is_primary: true, label: "Primary" },
  ]);

  // Predefined tag suggestions
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

  // Fetch business types on component mount
  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  // Fetch feedbacks when we move to step 2
  useEffect(() => {
    if (currentStep === 2 && createdBusinessId) {
      fetchFeedbacks();
    }
  }, [currentStep, createdBusinessId]);

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch("/api/business-types");
      if (response.ok) {
        const data = await response.json();
        setBusinessTypes(data.business_types);
      }
    } catch (error) {
      console.error("Error fetching business types:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addPhoneNumber = () => {
    setPhoneNumbers((prev) => [
      ...prev,
      { phone_number: "", is_primary: false, label: "Secondary" },
    ]);
  };

  const updatePhoneNumber = (
    index: number,
    field: keyof ContactInfo,
    value: string | boolean
  ) => {
    setPhoneNumbers((prev) =>
      prev.map((phone, i) =>
        i === index ? { ...phone, [field]: value } : phone
      )
    );
  };

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addEmailAddress = () => {
    setEmailAddresses((prev) => [
      ...prev,
      { email_address: "", is_primary: false, label: "Secondary" },
    ]);
  };

  const updateEmailAddress = (
    index: number,
    field: keyof EmailInfo,
    value: string | boolean
  ) => {
    setEmailAddresses((prev) =>
      prev.map((email, i) =>
        i === index ? { ...email, [field]: value } : email
      )
    );
  };

  const removeEmailAddress = (index: number) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Tag management functions
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.length >= 3) {
      const filtered = predefinedTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !selectedTags.includes(tag)
      );
      setTagSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      setSelectedTags((prev) => [...prev, tag.trim()]);
      setTagInput("");
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare the request data
      const requestData: CreateBusinessRequest = {
        name: formData.name,
        business_type_id: formData.business_type_id || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        google_maps_url: formData.google_maps_url,
        description: formData.description || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        phone_numbers: phoneNumbers.filter((phone) =>
          phone.phone_number.trim()
        ),
        email_addresses: emailAddresses.filter((email) =>
          email.email_address.trim()
        ),
      };

      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Business created successfully!");
        // Reset form or redirect
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Failed to create business");
      }
    } catch (error) {
      console.error("Error creating business:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Add New Business
        </h1>
        <p className="text-gray-600">
          Fill in the details to add your business location
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your business name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="business_type_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Type *
              </label>
              <select
                id="business_type_id"
                name="business_type_id"
                value={formData.business_type_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select business type</option>
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete business address with city, state, and pincode"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="google_maps_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Business Review link *
              </label>
              <input
                type="url"
                id="google_maps_url"
                name="google_maps_url"
                value={formData.google_maps_url}
                onChange={handleInputChange}
                required
                placeholder="https://www.google.com/maps/place/your-business/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your business, services, specialties, and what makes you unique..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Business Tags Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Business Tags *
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Add tags to help customers find your business. Type at least 3 characters to see suggestions.
          </p>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Remove tag"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tag Input with Autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagKeyPress}
              placeholder="Type to search for tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {tagSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-700">#{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Type at least 3 characters to see suggestions, or press Enter to add a custom tag.
          </p>
        </div>

        {/* Contact Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h2>
          </div>

          {/* Phone Numbers */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Phone Numbers *
              </label>
              <button
                type="button"
                onClick={addPhoneNumber}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Phone
              </button>
            </div>

            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <input
                  type="tel"
                  value={phone.phone_number}
                  onChange={(e) =>
                    updatePhoneNumber(index, "phone_number", e.target.value)
                  }
                  placeholder="+91 98765431210"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={phone.is_primary ? "Primary" : "Secondary"}
                  onChange={(e) =>
                    updatePhoneNumber(
                      index,
                      "is_primary",
                      e.target.value === "Primary"
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
                {phoneNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhoneNumber(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Email Addresses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Email Addresses *
              </label>
              <button
                type="button"
                onClick={addEmailAddress}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Email
              </button>
            </div>

            {emailAddresses.map((email, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <input
                  type="email"
                  value={email.email_address}
                  onChange={(e) =>
                    updateEmailAddress(index, "email_address", e.target.value)
                  }
                  placeholder="business@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={email.is_primary ? "Primary" : "Secondary"}
                  onChange={(e) =>
                    updateEmailAddress(
                      index,
                      "is_primary",
                      e.target.value === "Primary"
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
                {emailAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmailAddress(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && (
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
            )}
            {isLoading ? "Adding Business..." : "Add Business"}
          </button>
        </div>
      </form>
    </div>
  );
}
