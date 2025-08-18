import React from "react";

export const CTA = () => {
  return (
    <section className="py-24 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 animate-fadeInUp">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white animate-fadeInUp delay-100">
              Ready to Transform Your Business Reviews?
            </h2>
            <p className="text-blue-100 text-lg max-w-3xl mx-auto mb-8 animate-fadeInUp delay-200">
              Join thousands of businesses already using SnapReview.ai to boost their
              online reputation and attract more customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp delay-300">
              <button className="group inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-medium text-blue-600 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-gray-50">
                <span>Start Free Trial</span>
                <svg
                  className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200"
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
              </button>
              <button className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-white/20 hover:shadow-md hover:scale-105">
                Contact Sales
              </button>
            </div>
            <p className="text-xs text-blue-200 mt-4 animate-fadeInUp delay-400">
              No credit card required • Cancel anytime • 30-day free trial
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
