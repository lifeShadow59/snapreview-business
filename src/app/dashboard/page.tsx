"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/types/business";
import { CompactLogo } from "@/components/ui/Logo";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface DashboardStats {
  totalBusinesses: number;
  totalQRScans: number;
  totalReviews: number;
  averageRating: number;
  conversionRate: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalQRScans: 0,
    totalReviews: 0,
    averageRating: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserProfile({
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
      });
      fetchBusinesses();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);

        // Calculate dashboard stats
        const totalBusinesses = data.businesses.length;
        const totalQRScans = data.businesses.reduce(
          (sum: number, business: Business) =>
            sum + (business.metrics?.total_qr_scans || 0),
          0
        );
        const totalReviews = data.businesses.reduce(
          (sum: number, business: Business) =>
            sum + (business.metrics?.total_reviews || 0),
          0
        );
        const averageRating =
          totalReviews > 0
            ? data.businesses.reduce(
                (sum: number, business: Business) =>
                  sum + (business.metrics?.average_rating || 0),
                0
              ) /
              data.businesses.filter((b: Business) => b.metrics?.average_rating)
                .length
            : 0;
        const conversionRate =
          totalQRScans > 0 ? (totalReviews / totalQRScans) * 100 : 0;

        setStats({
          totalBusinesses,
          totalQRScans,
          totalReviews,
          averageRating: Number(averageRating.toFixed(1)),
          conversionRate: Number(conversionRate.toFixed(1)),
        });
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/auth/login",
      redirect: true,
    });
  };



  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Not authenticated
          </h1>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    );
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
                {userProfile.name || userProfile.email}
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
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {userProfile.name || "User"}!
            </p>
          </div>
          <button
            onClick={() => router.push("/businesses/add")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center"
          >
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Business
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className="text-sm font-medium text-gray-600">
                  Total QR Scans
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalQRScans}
                </p>
                <p className="text-sm text-green-600">+12% vs last month</p>
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
                <p className="text-sm font-medium text-gray-600">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalReviews}
                </p>
                <p className="text-sm text-green-600">+8% vs last month</p>
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
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating}
                </p>
                <p className="text-sm text-green-600">+3% vs last month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
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
                <p className="text-sm font-medium text-gray-600">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversionRate}%
                </p>
                <p className="text-sm text-red-600">-2% vs last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => router.push("/businesses/add")}
                className="w-full flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">
                    Add New Business
                  </h3>
                  <p className="text-sm text-gray-600">
                    Register a new business location
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <button
                onClick={() => {
                  if (businesses.length > 0) {
                    router.push(`/businesses/${businesses[0].id}/qr`);
                  } else {
                    router.push("/businesses/add");
                  }
                }}
                className="w-full flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">
                    Generate QR Code
                  </h3>
                  <p className="text-sm text-gray-600">
                    {businesses.length > 0
                      ? "Create QR codes for your businesses"
                      : "Add a business first to generate QR codes"}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>


            </div>
          </div>

          {/* Your Businesses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Businesses
                </h2>
                <button
                  onClick={() => router.push("/businesses")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all →
                </button>
              </div>
            </div>
            <div className="p-6">
              {businesses.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No businesses yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add your first business to get started
                  </p>
                  <button
                    onClick={() => router.push("/businesses/add")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add Business
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {businesses.slice(0, 3).map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {business.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div 
                        className="ml-3 flex-1 cursor-pointer"
                        onClick={() => router.push(`/businesses/${business.id}`)}
                      >
                        <h4 className="font-medium text-gray-900">
                          {business.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {business.business_type_name || "General Business"}
                        </p>
                      </div>
                      <div className="text-right mr-3">
                        <p className="text-sm font-medium text-gray-900">
                          {business.total_reviews || 0} reviews
                        </p>
                        <p className="text-xs text-gray-600">
                          {business.average_rating || 0} ⭐
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/businesses/${business.id}/edit`);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit business"
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
                          onClick={() => router.push(`/businesses/${business.id}`)}
                          className="p-1 text-gray-400 hover:text-gray-600"
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {businesses.length > 3 && (
                    <button
                      onClick={() => router.push("/businesses")}
                      className="w-full text-center py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View {businesses.length - 3} more businesses
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
