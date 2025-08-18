"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Business } from "@/types/business";
import { CompactLogo } from "@/components/ui/Logo";

interface QRCodeData {
  qrCode: string; // base64 data URL
  business: {
    id: string;
    name: string;
  };
  qrContent: string;
  generatedAt: string;
}

export default function QRCodeGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  // QR Code customization options
  const [qrOptions, setQrOptions] = useState({
    size: 256,
    margin: 4,
    errorCorrectionLevel: "M",
  });

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

  const generateQRCode = useCallback(async () => {
    setGenerating(true);
    setError("");

    try {
      const queryParams = new URLSearchParams({
        format: "dataURL",
        size: qrOptions.size.toString(),
        margin: qrOptions.margin.toString(),
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
      });

      const response = await fetch(
        `/api/businesses/${params.id}/qr?${queryParams}`
      );
      const data = await response.json();

      if (response.ok) {
        setQrData(data);
      } else {
        setError(data.error || "Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      setError("An unexpected error occurred");
    } finally {
      setGenerating(false);
    }
  }, [params.id, qrOptions.size, qrOptions.margin, qrOptions.errorCorrectionLevel]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && params.id) {
      fetchBusiness();
    }
  }, [status, router, params.id, fetchBusiness]);

  // Generate QR code when business is loaded
  useEffect(() => {
    if (business) {
      generateQRCode();
    }
  }, [business, generateQRCode]);

  const downloadQRCode = async (format: "png" | "svg") => {
    try {
      const queryParams = new URLSearchParams({
        format: format,
        size: qrOptions.size.toString(),
        margin: qrOptions.margin.toString(),
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
      });

      const response = await fetch(
        `/api/businesses/${params.id}/qr?${queryParams}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${business?.name || "business"}-qrcode.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to download QR code");
      }
    } catch (error) {
      console.error("Error downloading QR code:", error);
      setError("Failed to download QR code");
    }
  };

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/auth/login",
      redirect: true,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
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

  if (error && !business) {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
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
                QR Code Generator
              </h1>
              <p className="text-gray-600 mt-1">
                Generate and customize QR codes for{" "}
                <span className="font-medium">{business.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - QR Code Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              QR Code Preview
            </h2>

            <div className="flex flex-col items-center">
              {generating ? (
                <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : qrData ? (
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <Image
                    src={qrData.qrCode}
                    alt={`QR Code for ${business.name}`}
                    width={qrOptions.size}
                    height={qrOptions.size}
                    className="max-w-full h-auto"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">QR Code will appear here</p>
                </div>
              )}

              {qrData && (
                <div className="mt-6 w-full">
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={() => downloadQRCode("png")}
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download PNG
                    </button>
                    <button
                      onClick={() => downloadQRCode("svg")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download SVG
                    </button>
                  </div>

                  {/* QR Content Info */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      QR Code URL
                    </h3>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm text-gray-600 bg-white px-3 py-2 rounded border">
                        {qrData.qrContent}
                      </code>
                      <button
                        onClick={() => copyToClipboard(qrData.qrContent)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Copy to clipboard"
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Customization Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Customization Options
            </h2>

            <div className="space-y-6">
              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size: {qrOptions.size}px
                </label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  step="32"
                  value={qrOptions.size}
                  onChange={(e) =>
                    setQrOptions({
                      ...qrOptions,
                      size: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>128px</span>
                  <span>512px</span>
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margin: {qrOptions.margin}
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={qrOptions.margin}
                  onChange={(e) =>
                    setQrOptions({
                      ...qrOptions,
                      margin: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>8</span>
                </div>
              </div>

              {/* Error Correction Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Correction Level
                </label>
                <select
                  value={qrOptions.errorCorrectionLevel}
                  onChange={(e) =>
                    setQrOptions({
                      ...qrOptions,
                      errorCorrectionLevel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="L">Low (~7%)</option>
                  <option value="M">Medium (~15%)</option>
                  <option value="Q">Quartile (~25%)</option>
                  <option value="H">High (~30%)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Higher levels allow the QR code to be read even if partially
                  damaged
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateQRCode}
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Regenerate QR Code
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  How it works
                </h3>
                <p className="text-sm text-blue-700">
                  This QR code will direct customers to your business review
                  page where they can leave feedback and ratings. Print it and
                  display it at your business location for easy customer access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
