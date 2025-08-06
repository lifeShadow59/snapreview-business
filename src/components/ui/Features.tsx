import React from "react";

const FeatureCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: string;
}) => (
  <div
    className={`bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 hover:border-blue-300/50 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fadeInUp ${delay} group`}
  >
    <div className="mb-4 text-3xl group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
      {title}
    </h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export const Features = () => {
  return (
    <section
      className="py-24 px-4 md:px-6 bg-gradient-to-br from-gray-50 to-blue-50"
      id="features"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Grow Your Online Reputation
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools you need to
            collect, manage, and leverage customer reviews effectively.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📱"
            title="QR Code Generation"
            description="Create unlimited QR codes for all your business locations with custom branding."
            delay="delay-100"
          />
          <FeatureCard
            icon="🤖"
            title="AI-Powered Reviews"
            description="Generate personalized review templates using AI to boost your Google ratings."
            delay="delay-200"
          />
          <FeatureCard
            icon="📊"
            title="Advanced Analytics"
            description="Track scans, conversions, and customer engagement with detailed insights."
            delay="delay-300"
          />
          <FeatureCard
            icon="💬"
            title="Smart Feedback"
            description="Collect private feedback for improvements and public reviews for promotion."
            delay="delay-400"
          />
          <FeatureCard
            icon="📲"
            title="WhatsApp Campaigns"
            description="Send targeted review requests and promotional messages directly to customers."
            delay="delay-500"
          />
          <FeatureCard
            icon="🛡️"
            title="Secure & Compliant"
            description="Enterprise-grade security with full compliance to data protection regulations."
            delay="delay-600"
          />
        </div>
      </div>
    </section>
  );
};
