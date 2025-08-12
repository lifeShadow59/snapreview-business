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

interface Feedback {
  id?: number;
  business_id?: string;
  feedback: string;
  created_at?: string;
}

// Dummy data generator functions
const generateDummyData = () => {
  const dummyAddresses = ["123 Main Street, City, State 12345", "456 Business Ave, Town, State 67890"];
  const dummyDescriptions = [
    "A local business serving the community with quality products and services.",
    "Dedicated to providing excellent customer service and value."
  ];
  const dummyTagSets = [
    ["local", "community", "service"],
    ["business", "professional", "quality"]
  ];

  return {
    address: dummyAddresses[Math.floor(Math.random() * dummyAddresses.length)],
    description: dummyDescriptions[Math.floor(Math.random() * dummyDescriptions.length)],
    tags: dummyTagSets[Math.floor(Math.random() * dummyTagSets.length)],
    website: "https://example-business.com",
    phone_number: "+1 (555) 123-4567",
    email: "contact@example-business.com"
  };
};

export default function AddBusinessForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [createdBusinessId, setCreatedBusinessId] = useState<string>("");

  // Form state - name and google_maps_url are mandatory
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

  // Step 1 - Create Business
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Generate dummy data for empty fields
      const dummyData = generateDummyData();

      // Prepare the request data with dummy values for empty fields
      // Note: We don't send tags in Step 1 - they're only used for AI generation in Step 2
      const requestData: CreateBusinessRequest = {
        name: formData.name.trim(), // This is mandatory now
        business_type_id: formData.business_type_id || (businessTypes.length > 0 ? businessTypes[0].id : 1),
        website: formData.website.trim() || dummyData.website,
        address: formData.address.trim() || dummyData.address,
        google_maps_url: formData.google_maps_url, // This is mandatory
        description: formData.description.trim() || dummyData.description,
        tags: dummyData.tags, // Always use dummy tags for database, not user-selected tags
        phone_numbers: phoneNumbers.some(phone => phone.phone_number.trim())
          ? phoneNumbers.filter((phone) => phone.phone_number.trim())
          : [{ phone_number: dummyData.phone_number, is_primary: true, label: "Primary" }],
        email_addresses: emailAddresses.some(email => email.email_address.trim())
          ? emailAddresses.filter((email) => email.email_address.trim())
          : [{ email_address: dummyData.email, is_primary: true, label: "Primary" }],
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
        setCreatedBusinessId(data.business.id);
        setSuccess("Business created successfully! Now let's generate some reviews.");
        // Clear selected tags so they can be used fresh for AI generation in Step 2
        setSelectedTags([]);
        setTagInput("");
        setCurrentStep(2);
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

  // Step 2 - Feedback Management Functions
  const fetchFeedbacks = async () => {
    if (!createdBusinessId) return;

    try {
      const response = await fetch(`/api/businesses/${createdBusinessId}/feedbacks`);
      const data = await response.json();

      if (response.ok) {
        setFeedbacks(data.feedbacks);
      } else {
        console.error("Error fetching feedbacks:", data.error);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const addFeedback = async () => {
    if (!feedbackText.trim() || !createdBusinessId) return;

    setAddingFeedback(true);
    try {
      const response = await fetch(`/api/businesses/${createdBusinessId}/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback: feedbackText }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedbacks((prev) => [data.feedback, ...prev]);
        setFeedbackText("");
      } else {
        setError(data.error || "Failed to add feedback");
      }
    } catch (error) {
      console.error("Error adding feedback:", error);
      setError("An unexpected error occurred while adding feedback");
    } finally {
      setAddingFeedback(false);
    }
  };

  const generateAIFeedback = async () => {
    if (!createdBusinessId) return;

    setGeneratingAIFeedback(true);
    try {
      const response = await fetch(`/api/businesses/${createdBusinessId}/generate-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags: selectedTags // Send the current tags from the page
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedbackText(data.feedback);
      } else {
        setError(data.error || "Failed to generate AI feedback");
      }
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      setError("An unexpected error occurred while generating AI feedback");
    } finally {
      setGeneratingAIFeedback(false);
    }
  };

  const deleteFeedback = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    setDeletingFeedback(feedbackId);
    try {
      const response = await fetch(
        `/api/businesses/${createdBusinessId}/feedbacks/${feedbackId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete feedback");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      setError("An unexpected error occurred while deleting feedback");
    } finally {
      setDeletingFeedback(null);
    }
  };

  // Step 3 - Generate QR Code
  const generateQRCode = async () => {
    if (!createdBusinessId) return;

    setIsLoading(true);
    try {
      // Generate QR code URL for the business review page
      const reviewUrl = `http://review.snapreview.ai/review/${createdBusinessId}`;
      setQrCodeUrl(reviewUrl);
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrDataUrl);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error generating QR code:", error);
      setError("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  // Download QR Code function
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${formData.name || 'business'}-qr-code.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Print QR Code function
  const printQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${formData.name}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                text-align: center; 
                font-family: Arial, sans-serif; 
              }
              .qr-container { 
                display: inline-block; 
                padding: 20px; 
                border: 2px solid #000; 
                margin: 20px; 
              }
              h1 { margin-bottom: 10px; }
              p { margin: 5px 0; }
              img { display: block; margin: 20px auto; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${formData.name}</h1>
              <p>Scan to leave a review</p>
              <img src="${qrCodeDataUrl}" alt="QR Code" />
              <p>Or visit: ${qrCodeUrl}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Check if step 1 submit button should be enabled
  const isStep1Enabled = formData.name.trim().length > 0 && formData.google_maps_url.trim().length > 0;

  // Check if step 2 can proceed (at least one feedback required)
  const canProceedToStep3 = feedbacks.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Generate QR Code for Your Business
        </h1>
        <p className="text-gray-600">
          Follow these 3 simple steps to create your business QR code
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              1
            </div>
            <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
              Add Business Details
            </span>
          </div>
          <div className="flex-1 mx-4 h-1 bg-gray-200 rounded">
            <div className={`h-1 rounded transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
              }`}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              2
            </div>
            <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>
              Generate Reviews
            </span>
          </div>
          <div className="flex-1 mx-4 h-1 bg-gray-200 rounded">
            <div className={`h-1 rounded transition-all duration-300 ${currentStep >= 3 ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
              }`}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              3
            </div>
            <span className={`ml-2 text-sm font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'
              }`}>
              QR Code
            </span>
          </div>
        </div>
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

      {/* Step 1: Add Business Details */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-8">
          {/* Primary Section - Business Name and Review Link */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
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
                  Business Details
                </h2>
                <span className="ml-2 text-red-500 font-medium">*</span>
              </div>
              <button
                type="submit"
                disabled={!isStep1Enabled || isLoading}
                className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center ${isStep1Enabled && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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
                {isLoading ? "Creating Business..." : "Create Business & Continue"}
              </button>
            </div>

            <div className="space-y-4">
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
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="google_maps_url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Business Review Link *
                </label>
                <input
                  type="url"
                  id="google_maps_url"
                  name="google_maps_url"
                  value={formData.google_maps_url}
                  onChange={handleInputChange}
                  required
                  placeholder="https://www.google.com/maps/place/your-business/..."
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              <p className="text-sm text-gray-600">
                These are the only required fields. We'll fill in dummy data for other fields automatically.
              </p>
            </div>
          </div>

          {/* Secondary Section - Additional Business Details (Collapsible) */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Additional Business Details (Optional)
                </h2>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${showAdditionalDetails ? 'rotate-180' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdditionalDetails && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Business Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
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
                      Business Type
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
                      Business Address
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
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Business Description
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



                {/* Contact Information Section */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-4">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-3 h-3 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <h3 className="text-md font-semibold text-gray-900">
                      Contact Information
                    </h3>
                  </div>

                  {/* Phone Numbers */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Numbers
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
                        Email Addresses
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
              </div>
            )}
          </div>

        </form>
      )}

      {/* Step 2: Generate Reviews */}
      {currentStep === 2 && (
        <div className="space-y-8">
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Generate Reviews
                </h2>
                <span className="ml-2 text-red-500 font-medium">*</span>
              </div>
              <button
                onClick={generateQRCode}
                disabled={!canProceedToStep3 || isLoading}
                className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center ${canProceedToStep3 && !isLoading
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isLoading ? "Generating..." : "Generate QR Code"}
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Note:</strong> You need to create at least one review to proceed to QR code generation.
                Add tags related to your business to help AI generate better reviews.
              </p>

              {/* Business Tags for AI Generation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Tags (for AI Review Generation)
                </label>

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
                    placeholder="Type to search for tags (e.g., restaurant, coffee, service)..."
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
                  Add tags to help AI generate more relevant reviews for your business type.
                </p>
              </div>

              {/* Add New Review */}
              <div className="mb-6">
                <label
                  htmlFor="feedback"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Add New Review
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your review here or use AI to generate one..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {feedbackText.length}/1000 characters
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={generateAIFeedback}
                      disabled={generatingAIFeedback || addingFeedback}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      {generatingAIFeedback ? (
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
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
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
                          Generate AI Review
                        </>
                      )}
                    </button>
                    <button
                      onClick={addFeedback}
                      disabled={!feedbackText.trim() || addingFeedback}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {addingFeedback ? "Adding..." : "Add Review"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Review List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Review List ({feedbacks.length}) {feedbacks.length === 0 && <span className="text-red-500">- At least 1 required</span>}
                </h3>
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="font-medium">No reviews added yet</p>
                    <p className="text-sm">Add at least one review to proceed to QR code generation</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-gray-900 flex-1 mr-4">{feedback.feedback}</p>
                          <button
                            onClick={() => deleteFeedback(feedback.id!)}
                            disabled={deletingFeedback === feedback.id}
                            className="text-red-600 hover:text-red-700 disabled:text-gray-400 p-1"
                            title="Delete review"
                          >
                            {deletingFeedback === feedback.id ? (
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {feedback.created_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Added {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: QR Code Generation */}
      {currentStep === 3 && (
        <div className="space-y-8">
          <div className="bg-green-50 p-8 rounded-lg border-2 border-green-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Your QR Code is Ready!
              </h2>
              <p className="text-gray-600 mb-2">
                Scan this QR code to direct customers to your review page
              </p>
              <p className="text-sm text-gray-500">
                Business: <strong>{formData.name}</strong>
              </p>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* QR Code */}
              <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
                {qrCodeDataUrl ? (
                  <div className="text-center">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code" 
                      className="mx-auto mb-4"
                      style={{ width: '300px', height: '300px' }}
                    />
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Scan to leave a review</strong>
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      {qrCodeUrl}
                    </p>
                  </div>
                ) : (
                  <div className="w-72 h-72 flex items-center justify-center bg-gray-100 rounded">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-500">QR Code will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions and Actions */}
              <div className="flex-1 max-w-md">
                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    How to use your QR Code:
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600 mb-6">
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                      <span>Print the QR code and display it at your business location</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                      <span>Add it to receipts, business cards, or marketing materials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                      <span>Customers scan and are directed to your review page</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                      <span>Watch your positive reviews grow!</span>
                    </li>
                  </ul>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={downloadQRCode}
                      disabled={!qrCodeDataUrl}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download QR Code
                    </button>
                    
                    <button
                      onClick={printQRCode}
                      disabled={!qrCodeDataUrl}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print QR Code
                    </button>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-3">Quick Actions:</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/businesses/${createdBusinessId}`)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          View Business
                        </button>
                        <button
                          onClick={() => router.push("/dashboard")}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
