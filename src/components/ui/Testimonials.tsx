import React from "react";

const TestimonialCard = ({
  content,
  author,
  role,
  company,
  delay,
}: {
  content: string;
  author: string;
  role: string;
  company: string;
  delay: string;
}) => (
  <div
    className={`bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fadeInUp ${delay} group`}
  >
    <div className="mb-4">
      <div className="flex text-yellow-400 mb-2 animate-fadeIn group-hover:scale-110 transition-transform duration-300">
        {"★".repeat(5)}
      </div>
      <p className="text-gray-700 leading-relaxed">&ldquo;{content}&rdquo;</p>
    </div>
    <div>
      <div className="font-semibold text-gray-800">{author}</div>
      <div className="text-sm text-gray-600">
        {role} at {company}
      </div>
    </div>
  </div>
);

export const Testimonials = () => {
  return (
    <section
      className="py-24 px-4 md:px-6 bg-gradient-to-br from-gray-50 to-blue-50"
      id="testimonials"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Loved by{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              businesses
            </span>{" "}
            worldwide
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            See what our customers are saying about how SnapReview.ai transformed
            their online reputation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <TestimonialCard
            content="SnapReview.ai increased our Google reviews by 300% in just 2 months! Our customers love how easy it is to leave feedback."
            author="Priya Sharma"
            role="Owner"
            company="Spice Garden Restaurant"
            delay="delay-100"
          />
          <TestimonialCard
            content="The AI-powered review templates are amazing. We went from 3.2 to 4.8 stars on Google. Best investment for our hotel!"
            author="Raj Patel"
            role="Manager"
            company="Heritage Hotel Group"
            delay="delay-200"
          />
          <TestimonialCard
            content="The analytics dashboard shows exactly which locations need attention. WhatsApp campaigns doubled our review response rate."
            author="Meera Singh"
            role="Marketing Director"
            company="Glow Beauty Salons"
            delay="delay-300"
          />
        </div>
      </div>
    </section>
  );
};
