"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Business } from "@/types/business";
import { CompactLogo } from "@/components/ui/Logo";
import LanguageSelector from "@/components/business/LanguageSelector";
import BulkFeedbackGenerator from "@/components/business/BulkFeedbackGenerator";

interface Feedback {
  id: number;
  business_id: string;
  feedback: string;
  created_at: string;
}

export default function BusinessDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // Feedback management state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [addingFeedback, setAddingFeedback] = useState(false);
  const [updatingFeedback, setUpdatingFeedback] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState<number | null>(null);
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);
  
  // Language management state
  const [businessLanguages, setBusinessLanguages] = useState<string[]>([]);
  const [languagesLocked, setLanguagesLocked] = useState(false);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>("");

  const fetchBusiness = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setBusiness(data.business);
      } else {
        setError(data.error || "Failed to fetch business details");
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/auth/login",
      redirect: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Feedback management functions
  const fetchFeedbacks = useCallback(async () => {
    try {
      const url = selectedLanguageFilter 
        ? `/api/businesses/${params.id}/feedbacks?language=${selectedLanguageFilter}`
        : `/api/businesses/${params.id}/feedbacks`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setFeedbacks(data.feedbacks);
      } else {
        console.error("Error fetching feedbacks:", data.error);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  }, [params.id, selectedLanguageFilter]);

  const fetchLanguagePreferences = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${params.id}/languages`);
      const data = await response.json();

      if (response.ok) {
        setBusinessLanguages(data.languages.map((lang: { language_code: string }) => lang.language_code));
        setLanguagesLocked(data.locked);
      }
    } catch (error) {
      console.error("Error fetching language preferences:", error);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && params.id) {
      fetchBusiness();
      fetchFeedbacks();
      fetchLanguagePreferences();
    }
  }, [status, router, params.id, fetchBusiness, fetchFeedbacks, fetchLanguagePreferences]);

  // Refetch feedbacks when language filter changes
  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetchFeedbacks();
    }
  }, [selectedLanguageFilter, fetchFeedbacks, status, params.id]);

  const addFeedback = async () => {
    if (!feedbackText.trim()) return;

    setAddingFeedback(true);
    try {
      const response = await fetch(`/api/businesses/${params.id}/feedbacks`, {
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

  const startEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback.id);
    setEditingText(feedback.feedback);
  };

  const cancelEditFeedback = () => {
    setEditingFeedback(null);
    setEditingText("");
  };

  const updateFeedback = async (feedbackId: number) => {
    if (!editingText.trim()) return;

    setUpdatingFeedback(true);
    try {
      const response = await fetch(
        `/api/businesses/${params.id}/feedbacks/${feedbackId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback: editingText }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFeedbacks((prev) =>
          prev.map((f) =>
            f.id === feedbackId ? { ...f, feedback: editingText } : f
          )
        );
        setEditingFeedback(null);
        setEditingText("");
      } else {
        setError(data.error || "Failed to update feedback");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      setError("An unexpected error occurred while updating feedback");
    } finally {
      setUpdatingFeedback(false);
    }
  };

  const deleteFeedback = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    setDeletingFeedback(feedbackId);
    try {
      const response = await fetch(
        `/api/businesses/${params.id}/feedbacks/${feedbackId}`,
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

  const generateAIFeedback = async () => {
    setGeneratingAIFeedback(true);
    try {
      const response = await fetch(`/api/businesses/${params.id}/generate-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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



  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => router.push("/dashboard")}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center text-sm font-bold">
                    QR
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    ReviewQR
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div
                className="flex items-center cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                <CompactLogo />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {business.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {business.business_type_name || "General Business"} • Created{" "}
                  {formatDate(business.created_at)}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/businesses/${business.id}/qr`)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Generate QR Code
              </button>
              <button 
                onClick={() => router.push(`/businesses/${business.id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Business
              </button>
            </div>
          </div>
        </div>

        {/* Business Status */}
        <div className="mb-8">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              business.status === "active"
                ? "bg-green-100 text-green-800"
                : business.status === "inactive"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                business.status === "active"
                  ? "bg-green-400"
                  : business.status === "inactive"
                  ? "bg-red-400"
                  : "bg-yellow-400"
              }`}
            ></div>
            {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
          </span>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">QR Scans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.metrics?.total_qr_scans || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.metrics?.total_reviews || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.metrics?.average_rating || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.metrics?.conversion_rate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Business Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Business Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {business.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-900 text-break-words">
                      {business.description}
                    </p>
                  </div>
                )}

                {business.address && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Address
                    </h3>
                    <p className="text-gray-900">{business.address}</p>
                  </div>
                )}

                {business.website && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Website
                    </h3>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {business.website}
                    </a>
                  </div>
                )}

                {business.google_maps_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Google Maps
                    </h3>
                    <a
                      href={business.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Tags */}
            {business.tags && business.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        #{tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Language Preferences */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Language Preferences
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Set up to 3 languages for multilingual feedback generation
                </p>
              </div>
              <div className="p-6">
                <LanguageSelector
                  businessId={params.id as string}
                  selectedLanguages={businessLanguages}
                  onLanguagesChange={setBusinessLanguages}
                  disabled={languagesLocked}
                />
              </div>
            </div>

            {/* Bulk Feedback Generator */}
            {business.tags && business.tags.length > 0 && (
              <BulkFeedbackGenerator
                key={`bulk-feedback-${businessLanguages.join('-')}`} // Force re-render when languages change
                businessId={params.id as string}
                businessTags={business.tags.map(tag => tag.tag)}
                onFeedbackGenerated={(feedbacks) => {
                  console.log("Generated feedbacks:", feedbacks);
                  // Refresh feedbacks list after generation
                  fetchFeedbacks();
                }}
                onFeedbacksSaved={() => {
                  // Refresh feedbacks list after saving bulk feedbacks
                  fetchFeedbacks();
                }}
                onLanguagesChanged={() => {
                  // Refresh language preferences when they change
                  fetchLanguagePreferences();
                }}
              />
            )}

            {/* Business Feedbacks */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Business Feedbacks
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Add and manage feedback for your business
                    </p>
                  </div>
                  {businessLanguages.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        Filter by language:
                      </label>
                      <select
                        value={selectedLanguageFilter}
                        onChange={(e) => setSelectedLanguageFilter(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All languages</option>
                        {businessLanguages.map((langCode) => (
                          <option key={langCode} value={langCode}>
                            {langCode.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {/* Add New Feedback */}
                <div className="mb-6">
                  <label
                    htmlFor="feedback"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Add New Feedback
                  </label>
                  <textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Enter your feedback here..."
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
                            Generate AI Feedback
                          </>
                        )}
                      </button>
                      <button
                        onClick={addFeedback}
                        disabled={!feedbackText.trim() || addingFeedback}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        {addingFeedback ? "Adding..." : "Add Feedback to List"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feedback List */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Feedback List ({feedbacks.length})
                  </h3>
                  {feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
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
                      <p>No feedback added yet</p>
                      <p className="text-sm">Add your first feedback above</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbacks.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          {editingFeedback === feedback.id ? (
                            <div>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  {editingText.length}/1000 characters
                                </span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => updateFeedback(feedback.id)}
                                    disabled={!editingText.trim() || updatingFeedback}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    {updatingFeedback ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={cancelEditFeedback}
                                    disabled={updatingFeedback}
                                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-900 mb-2 whitespace-pre-wrap">
                                {feedback.feedback}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  Added on {formatDate(feedback.created_at)}
                                </span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => startEditFeedback(feedback)}
                                    disabled={editingFeedback !== null || deletingFeedback !== null}
                                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent rounded transition-colors"
                                    title="Edit feedback"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => deleteFeedback(feedback.id)}
                                    disabled={editingFeedback !== null || deletingFeedback !== null}
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent rounded transition-colors relative"
                                    title="Delete feedback"
                                  >
                                    {deletingFeedback === feedback.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin"
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
                                    ) : (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Information */}
          <div className="space-y-6">
            {/* Phone Numbers */}
            {business.phone_numbers && business.phone_numbers.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Phone Numbers
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  {business.phone_numbers.map((phone, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {phone.phone_number}
                        </p>
                        <p className="text-sm text-gray-600">{phone.label}</p>
                      </div>
                      {phone.is_primary && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Addresses */}
            {business.email_addresses &&
              business.email_addresses.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Email Addresses
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {business.email_addresses.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {email.email_address}
                          </p>
                          <p className="text-sm text-gray-600">{email.label}</p>
                        </div>
                        {email.is_primary && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Business Meta Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Business Details
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Business Type
                  </span>
                  <span className="text-sm text-gray-900">
                    {business.business_type_name || "General Business"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Status
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      business.status === "active"
                        ? "text-green-600"
                        : business.status === "inactive"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {business.status.charAt(0).toUpperCase() +
                      business.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Created
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(business.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Last Updated
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(business.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
