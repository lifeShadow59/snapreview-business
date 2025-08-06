import React from "react";

const StepCard = ({
  number,
  title,
  description,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  delay: string;
}) => (
  <div
    className={`relative p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:border-blue-300/50 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fadeInUp ${delay} group`}
  >
    {/* Step Number */}
    <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
      {number}
    </div>

    {/* Content */}
    <div className="pt-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
    </div>

    {/* Decorative arrow for desktop */}
    <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2 text-gray-300 group-hover:text-blue-400 transition-colors duration-300">
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </div>
  </div>
);

export const HowItWorks = () => {
  return (
    <section className="py-24 px-4 md:px-6 bg-white" id="how-it-works">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            How It{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Get started in minutes with our simple 3-step process
          </p>
        </div>

        <div className="grid gap-12 lg:gap-16 lg:grid-cols-3 relative">
          {/* Background connecting line for desktop */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 z-0"></div>

          <StepCard
            number="1"
            title="Setup Your Business"
            description="Add your business details and Google review link. Our AI generates a personalized review page for your customers."
            delay="delay-100"
          />
          <StepCard
            number="2"
            title="Generate QR Codes"
            description="Create unlimited QR codes for tables, receipts, or marketing materials. Print brochures to display at your location."
            delay="delay-300"
          />
          <StepCard
            number="3"
            title="Collect Reviews"
            description="Customers scan, rate, and automatically post 5-star reviews to Google. Lower ratings become private feedback for improvement."
            delay="delay-500"
          />
        </div>

        {/* Call to action */}
        <div
          className="text-center mt-16 animate-fadeInUp"
          style={{ animationDelay: "0.7s" }}
        >
          <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <div className="flex items-center">
              <span className="text-primary-foreground">Get Started Today</span>
              <svg
                className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
