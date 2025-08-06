import React from "react";

const PricingCard = ({
  title,
  price,
  period,
  features,
  isPopular,
  delay,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  delay: string;
}) => (
  <div
    className={`relative p-8 bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fadeInUp ${delay} ${
      isPopular
        ? "border-blue-500 shadow-lg shadow-blue-500/20"
        : "border-gray-200 hover:border-blue-300"
    }`}
  >
    {/* Popular Badge */}
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full">
        Most Popular
      </div>
    )}

    {/* Header */}
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <div className="flex items-center justify-center">
        <span className="text-4xl font-bold text-gray-800">{price}</span>
        <span className="text-gray-600 ml-2">{period}</span>
      </div>
    </div>

    {/* Features */}
    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <svg
            className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-gray-600">{feature}</span>
        </li>
      ))}
    </ul>

    {/* CTA Button */}
    <button
      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
        isPopular
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }`}
    >
      Get Started
    </button>
  </div>
);

export const Pricing = () => {
  return (
    <section
      className="py-24 px-4 md:px-6 bg-gradient-to-br from-gray-50 to-blue-50"
      id="pricing"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Simple,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Choose the plan that works best for your business. No hidden fees,
            cancel anytime.
          </p>
        </div>

        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 max-w-4xl mx-auto">
          <PricingCard
            title="Monthly"
            price="₹200"
            period="/month"
            features={[
              "Up to 3 business locations",
              "Unlimited QR code generation",
              "AI-powered review templates",
              "Basic analytics dashboard",
              "Email support",
            ]}
            delay="delay-100"
          />
          <PricingCard
            title="Yearly"
            price="₹2,000"
            period="/year"
            features={[
              "Up to 3 business locations",
              "Unlimited QR code generation",
              "AI-powered review templates",
              "Advanced analytics & reports",
              "WhatsApp campaign tools",
              "Priority support",
              "Custom branding options",
            ]}
            isPopular={true}
            delay="delay-300"
          />
        </div>

        {/* Additional info */}
        <div
          className="text-center mt-12 animate-fadeInUp"
          style={{ animationDelay: "0.5s" }}
        >
          <p className="text-gray-500 text-sm mb-6">
            All plans include enterprise-grade security and compliance
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              30-day free trial
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Cancel anytime
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              No setup fees
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
