"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/types/business";

interface BusinessListItemProps {
  business: Business;
  onEdit: () => void;
  onDelete: () => void;
  showActions?: boolean;
}

export default function BusinessListItem({
  business,
  onEdit,
  onDelete,
  showActions = true,
}: BusinessListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete business");
      }
    } catch (error) {
      console.error("Error deleting business:", error);
      alert("An unexpected error occurred while deleting the business");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/businesses/${business.id}`);
  };

  return (
    <div className="flex items-center p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
      {/* Business Icon */}
      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-white font-medium text-lg">
          {business.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Business Info */}
      <div 
        className="ml-4 flex-1 cursor-pointer"
        onClick={handleViewDetails}
      >
        <h4 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
          {business.name}
        </h4>
        <p className="text-sm text-gray-600">
          {business.business_type_name || "General Business"}
        </p>
        {business.address && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {business.address}
          </p>
        )}
      </div>

      {/* Business Metrics */}
      <div className="text-right mr-4 flex-shrink-0">
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {business.metrics?.total_qr_scans || 0}
            </p>
            <p className="text-xs text-gray-600">Scans</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {business.metrics?.total_reviews || 0}
            </p>
            <p className="text-xs text-gray-600">Reviews</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">
              {business.metrics?.average_rating || 0}⭐
            </p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
            title="View business details"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete business"
          >
            {isDeleting ? (
              <svg
                className="w-4 h-4 animate-spin"
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
      )}
    </div>
  );
}